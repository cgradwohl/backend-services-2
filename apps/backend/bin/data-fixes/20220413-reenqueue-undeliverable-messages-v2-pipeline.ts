import { actionService } from "~/send/service";
import { IPrepareAction } from "~/send/types";
import { Handler, IDataFixEvent } from "./types";
import { getItem } from "~/lib/dynamo";

interface IEvent extends IDataFixEvent {
  messages: [
    {
      messageId: string;
      tenantId: string;
    }
  ];
}

// NOTE: this only handles API v2 messages
const handler: Handler<IEvent> = async (event, _context) => {
  const { messages } = event;

  for (const message of messages) {
    const { messageId, tenantId } = message;
    const { Item: messageEvent } = await getItem({
      Key: { pk: `${tenantId}/${messageId}` },
      TableName: process.env.MESSAGES_V3_TABLE,
    });

    try {
      console.log("Enqueuing v2 message ", messageId);
      await actionService(tenantId).emit<IPrepareAction>({
        command: "prepare",
        dryRunKey: undefined,
        messageId,
        tenantId,
        messageFilePath: messageEvent.filePath,
        requestId: messageId,
      });
      console.log("Enqueued v2 message ", messageId);
    } catch (err) {
      console.error("Error occured during enqueuing", err);
    }
  }
};

export default handler;
