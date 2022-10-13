import chunkArray from "~/lib/chunk-array";
import { enqueueByQueueUrl } from "~/lib/enqueue";
import overflowService from "~/overflow/service";
import { OverflowMessage } from "~/overflow/types";
import { SqsPrepareMessage } from "~/types.internal";

const enqueuePrepare = enqueueByQueueUrl<SqsPrepareMessage>(
  process.env.SQS_PREPARE_QUEUE_URL
);
interface IOverflowEvent {
  tenantId: string;
}

export default async (event: IOverflowEvent) => {
  if (!event.tenantId) {
    throw new Error(
      "Invalid Invocation. An event of type IOverflowEvent is required."
    );
  }

  const overflow = overflowService(event.tenantId);

  const list = await overflow.list();
  const chunks = chunkArray(
    list,
    parseInt(process.env.OVERFLOW_CHUNK_SIZE ?? "250", 10)
  );

  for (const chunk of chunks) {
    const responses = await Promise.allSettled(
      chunk.map(async (item) => {
        // if delete fails, swallow the error, item stays in table and we process in the next batch
        await overflow.delete(item);

        try {
          const result = await enqueuePrepare({
            messageId: item.messageId,
            messageLocation: {
              path: item.filePath,
              type: "S3",
            },
            tenantId: item.tenantId,
            type: "prepare",
          });

          return result;
        } catch (error) {
          console.error(error);

          // if enqueue fails, then that means delete was successful, so catch error and re put into table
          const overflowMessage = new OverflowMessage(item);

          await overflow.create(overflowMessage);
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
