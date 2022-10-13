import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import { EventBridge } from "aws-sdk";
import { PutEventsRequest } from "aws-sdk/clients/eventbridge";
import schedulerService from "~/automations/lib/services/scheduler";
import { IScheduleItem } from "~/automations/types";
import toJson from "~/lib/dynamo/to-json";

const eventbridge = new EventBridge();

const worker = async (record: DynamoDBRecord) => {
  const { eventName, dynamodb, userIdentity = {} } = record;

  const ttlEvent =
    eventName === "REMOVE" &&
    userIdentity.type === "Service" &&
    userIdentity.principalId === "dynamodb.amazonaws.com";

  if (!ttlEvent) {
    return;
  }

  const {
    enabled,
    itemId,
    scope,
    templateId,
    tenantId,
    value, // either cron or date string
  } = toJson<IScheduleItem>(dynamodb.OldImage); // OldImage is the ttl'd item

  if (!enabled) {
    // if record is disabled then return
    return;
  }

  const scheduler = schedulerService(tenantId, scope);
  const newTTL = await scheduler.calculateTTL(value);

  if (!newTTL) {
    // if newTTL is undefined then the value is either incorrectly formatted
    // of the date is expired. In either case, we don't want proceed.
    return;
  }

  await scheduler.saveItem({
    enabled,
    itemId,
    scope,
    templateId,
    tenantId,
    ttl: newTTL,
    value,
  });

  // TODO: need to be able to inject context data
  const putEvent: PutEventsRequest = {
    Entries: [
      {
        Detail: JSON.stringify({
          scope,
          source: [`schedule/${itemId}`],
          templateId,
          tenantId,
        }),
        DetailType: process.env.AUTOMATION_SCHEDULER_TABLE,
        EventBusName: process.env.COURIER_EVENT_BUS_NAME,
        Source: "courier.automation.invoke",
      },
    ],
  };

  await eventbridge.putEvents(putEvent).promise();
};

export default async (event: DynamoDBStreamEvent) => {
  await Promise.all(event.Records.map(worker));
};
