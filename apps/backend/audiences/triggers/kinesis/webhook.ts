import {
  IDDBAudienceCalculation,
  IDDBAudienceKeys,
  IDDBAudienceMember,
} from "~/audiences/stores/dynamo/types";
import { DynamoDBRecord, KinesisStreamRecord } from "aws-lambda";
import { DynamoDB, EventBridge } from "aws-sdk";
import { PutEventsRequest } from "aws-sdk/clients/eventbridge";
import { IDDBAudience } from "~/audiences/stores/dynamo/types";
import getEnvironmentVariable from "~/lib/get-environment-variable";
import { createEventHandlerWithoutSequenceChecking } from "~/lib/kinesis/create-event-handler";
import kinesisToJson from "~/lib/kinesis/to-json";
import logger from "~/lib/logger";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { WebhookEventTypes } from "~/webhooks/types";

const eventbridge = new EventBridge();

function getDocumentType(
  document: IDDBAudienceKeys
): "audience" | "audienceMember" | "audienceCalculation" {
  if (document.pk.startsWith("a/")) {
    return "audience";
  }
  if (document.pk.startsWith("a_m/")) {
    return "audienceMember";
  }
  if (document.pk.startsWith("a_cal_status/")) {
    return "audienceCalculation";
  }
}

const eventType = {
  audiences: {
    insert: "audiences:created",
    modify: "audiences:updated",
    remove: "audiences:deleted",
  },
  "audiences:user": {
    insert: "audiences:user:matched",
    modify: "audiences:user:matched",
    remove: "audiences:user:unmatched",
  },
  "audiences:calculated": {
    insert: "audiences:calculated",
    modify: "audiences:calculated",
  },
};

async function handler(record: KinesisStreamRecord) {
  const item = kinesisToJson<DynamoDBRecord>(record.kinesis.data);
  const eventName = item.eventName;

  const data = DynamoDB.Converter.unmarshall(
    eventName === "REMOVE" ? item.dynamodb.OldImage : item.dynamodb.NewImage
  ) as IDDBAudience | IDDBAudienceMember;

  let webhookEventType: Extract<
    WebhookEventTypes,
    | "audiences:created"
    | "audiences:deleted"
    | "audiences:updated"
    | "audiences:calculated"
    | "audiences:user:matched"
    | "audiences:user:unmatched"
  >;

  let payload;

  const isAudienceMember = "userId" in data;

  const documentType = getDocumentType(data);

  if (documentType === "audience") {
    const { version, filter, audienceId } = data as IDDBAudience;
    webhookEventType = eventType["audiences"][eventName.toLocaleLowerCase()];
    logger.debug(
      `Sending a/${data.workspaceId}/${data.audienceId} of type ${webhookEventType} to courier-event-bus`
    );
    payload = {
      audience_id: audienceId,
      audience_version: version,
      filter: filter,
    };
  }

  if (documentType === "audienceCalculation") {
    const { audienceId, userCount, totalUsers, totalUsersFiltered } =
      data as unknown as IDDBAudienceCalculation;
    webhookEventType =
      eventType["audiences:calculated"][eventName.toLocaleLowerCase()];

    // do not move further if its not fully calculated

    if (totalUsers !== userCount + totalUsersFiltered) {
      logger.debug(
        `Skipping a/${data.workspaceId}/${data.audienceId} of type ${webhookEventType} to courier-event-bus because it is not fully calculated`
      );
      return;
    }

    payload = {
      audience_id: audienceId,
      user_count: userCount,
      total_users: totalUsers,
      total_users_filtered: totalUsersFiltered,
    };
  }

  if (isAudienceMember) {
    webhookEventType =
      eventType["audiences:user"][eventName.toLocaleLowerCase()];
    logger.debug(
      `Sending a_m/${data.workspaceId}/${data.audienceId}/${data.userId} of type ${webhookEventType} to courier-event-bus`
    );
    payload = {
      audience_id: data.audienceId,
      audience_version: data.audienceVersion,
      reason: data.reason,
      user_id: data.userId,
    };
  }

  const baseEntry = {
    Detail: JSON.stringify({
      data: { ...payload, id: data.audienceId },
      type: webhookEventType,
      tenantId: data.workspaceId,
    }),
    // this isn't optional and is required by the eventbridge api
    DetailType: "audiences",
    EventBusName: getEnvironmentVariable("COURIER_EVENT_BUS_NAME"),
    Source: "courier.webhooks.emit",
  };

  const Entries = isAudienceMember
    ? [
        baseEntry,
        {
          Detail: JSON.stringify({
            audienceId: data.audienceId,
            type: webhookEventType,
            userId: data.userId,
            workspaceId: data.workspaceId,
            // should this work with draft? I don't think so
            scope: data.workspaceId.endsWith("test")
              ? "published/test"
              : "published/production",
            source: webhookEventType,
            trackingId: createTraceId(),
          }),
          DetailType: "audiences-automation-trigger",
          EventBusName: getEnvironmentVariable("COURIER_EVENT_BUS_NAME"),
          Source: "courier.automation.trigger",
        },
      ]
    : [baseEntry];

  const putEventsRequest: PutEventsRequest = {
    Entries,
  };

  await eventbridge.putEvents(putEventsRequest).promise();

  logger.debug(`Sent ${webhookEventType} to courier-event-bus`);
}

export default createEventHandlerWithoutSequenceChecking(handler);
