import { PutEventsRequestEntry } from "aws-sdk/clients/eventbridge";
import AWS from "~/lib/aws-sdk";

const eventbridge = new AWS.EventBridge();

export const putEvents = async (events: PutEventsRequestEntry[]) => {
  return await eventbridge
    .putEvents({
      Entries: events,
    })
    .promise();
};
