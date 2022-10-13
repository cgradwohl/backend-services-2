import { getPrepareFilePath } from "~/api/send";

import enqueue from "~/lib/enqueue";
import { SqsPrepareMessage } from "~/types.internal";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  messages: [
    {
      messageId: string;
      tenantId: string;
    }
  ];
}

const enqueuePrepare = enqueue<SqsPrepareMessage>(
  process.env.SQS_PREPARE_QUEUE_NAME
);

// NOTE: this only handles API v1 messages
const handler: Handler<IEvent> = async (event, context) => {
  const { messages } = event;

  for (const message of messages) {
    const { messageId, tenantId } = message;

    try {
      console.log("Enqueuing v1 message ", messageId);
      await enqueuePrepare({
        messageId,
        messageLocation: {
          path: getPrepareFilePath(tenantId, messageId),
          type: "S3",
        },
        tenantId,
        type: "prepare",
      });
      console.log("Enqueued v1 message ", messageId);
    } catch (err) {
      console.error("Error occured during enqueuing", err);
    }
  }
};

export default handler;
