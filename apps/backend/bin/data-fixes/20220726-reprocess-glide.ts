import { saveAndEnqueue as saveAndEnqueuePrepare } from "~/api/send";
import chunkArray from "~/lib/chunk-array";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import { S3PrepareMessage } from "~/types.internal";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  records: [{ messageId: string; recipientId: string }];
}

const handler: Handler<IEvent> = async (event) => {
  const { records } = event;
  const eventId = "CC5QJ6FQD3MR98M2VQBQCAMAC1PM";
  const listId = "93444f9c-1420-470a-9810-326273c9a8c7";
  const tenantId = "4bbb0473-a777-45ff-9129-befff793533b";

  // lets say we do 1000 records at a time - this will loop 10 times, and each iteration will process 100 records in parallel
  // assuming each chunk takes 500ms to get processed, we should be able to wrap up 1000 records in ~5 seconds
  const chunks = chunkArray(records, 100);

  for (const chunk of chunks) {
    const responses = await Promise.allSettled(
      chunk.map(async (record) => {
        const { messageId, recipientId } = record;

        // logic borrowed from triggers/sqs/send-list-or-pattern/list.ts
        try {
          // construct message for prepare queue
          const s3Message: S3PrepareMessage = {
            ...{
              // list send s3 message object (4bbb0473-a777-45ff-9129-befff793533b/send-list-Oe4rA6t7EEamblGFAtjVR.json)
              eventData: {},
              eventId,
              list: {
                created: 1658504761579,
                creator: "tenant/4bbb0473-a777-45ff-9129-befff793533b",
                id: listId,
                name: "Pricing v2 Subscribers",
                updated: 1658506628539,
                updater: "tenant/4bbb0473-a777-45ff-9129-befff793533b",
              },
              scope: "published/production",
            },
            eventData: {},
            eventId,
            recipientId,
          };

          // creates an s3 message object and enqueues onto prepare queue
          await saveAndEnqueuePrepare(messageId, tenantId, s3Message);

          // create event:received
          await createLogEntry(tenantId, messageId, EntryTypes.eventReceived, {
            body: {
              data: {},
              event: eventId,
              list: listId,
              recipient: recipientId,
            },
          });

          console.log(
            `Successfully reprocessed message ${messageId} for recipient ${recipientId}`
          );
        } catch (err) {
          console.error(
            `Failed to reprocess ${messageId} for recipient ${recipientId}`
          );
        }
      })
    );

    responses.map((response) => {
      if (response.status === "rejected") {
        console.error(response.reason);
      }
    });
  }
};

export default handler;
