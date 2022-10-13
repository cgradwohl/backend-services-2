import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import toJson from "~/lib/dynamo/to-json";
import { actionService } from "~/send/service";
import { ScheduleJob } from "~/send/service/schedule";
import { IPrepareAction } from "~/send/types";
import logger from "~/lib/logger";

const worker = async (record: DynamoDBRecord) => {
  try {
    const { eventName, dynamodb, userIdentity = {} } = record;
    const ttlEvent =
      eventName === "REMOVE" &&
      userIdentity.type === "Service" &&
      userIdentity.principalId === "dynamodb.amazonaws.com";

    if (!ttlEvent) {
      return;
    }

    const job = toJson<ScheduleJob>(dynamodb.OldImage);

    // emit prepare
    await actionService(job.workspaceId).emit<IPrepareAction>({
      command: "prepare",
      dryRunKey: undefined,
      messageId: job.messageId,
      messageFilePath: job.messageFilePath,
      requestId: job.requestId,
      scheduleJobId: job.scheduleJobId,
      tenantId: job.workspaceId,
    });
  } catch (error) {
    logger.warn("Schedule Table Worker Error");
    logger.warn(error);
  }
};

export default async (event: DynamoDBStreamEvent) => {
  await Promise.all(event.Records.map(worker));
};
