import getUnixTime from "date-fns/getUnixTime";
import { nanoid } from "nanoid";
import { MessageDelay } from "~/api/send/types";
import { getItem, put } from "~/lib/dynamo";
import getEnvVar from "~/lib/get-environment-variable";
import { putRecord } from "~/lib/kinesis";
import { ScheduleJob } from "./schedule-job.entity";
import { IScheduleJobItem } from "./schedule-job.types";

const StreamName = getEnvVar("SCHEDULE_STREAM");
const TableName = getEnvVar("SCHEDULE_TABLE");

export default (workspaceId: string) => {
  return {
    get: async (scheduleJobId: string) => {
      const { pk, sk } = ScheduleJob.key({ scheduleJobId });
      const { Item } = await getItem({
        Key: {
          pk,
          sk,
        },
        TableName,
      });

      if (!Item) {
        return undefined;
      }

      return ScheduleJob.fromItem(Item);
    },
    create: async (item: IScheduleJobItem) => {
      const job = new ScheduleJob({
        ...item,
      });
      await put({
        Item: job.toItem(),
        TableName,
      });
      return job;
    },
    putJob: async (params: {
      delay: MessageDelay;
      messageFilePath: string;
      messageId: string;
      requestId: string;
    }) => {
      const { delay, messageFilePath, messageId, requestId } = params;

      // NOTE: only delay.duration as a millisecond value is currently supported
      const expiration = getUnixTime(
        new Date().getTime() + Number(delay.duration)
      );

      const scheduleJob = new ScheduleJob({
        expiration,
        messageId,
        messageFilePath,
        requestId,
        workspaceId,
      });

      await putRecord<any>({
        Data: scheduleJob,
        PartitionKey: nanoid(),
        StreamName,
      });

      return scheduleJob;
    },
  };
};
