import { createArchivedEvent } from "~/lib/dynamo/event-logs";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  messageIds: string[];
}

const handler: Handler<IEvent> = async (event) => {
  const { tenantId, messageIds } = event;

  await Promise.all(
    messageIds.map(async (messageId) => {
      try {
        await createArchivedEvent(tenantId, messageId, {});
        console.log(`Successfully archived ${messageId}`);
      } catch (err) {
        console.error(`Failed to archive ${messageId}`);
      }
    })
  );
};

export default handler;
