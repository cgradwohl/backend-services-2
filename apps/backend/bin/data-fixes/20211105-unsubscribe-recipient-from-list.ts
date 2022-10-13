import { Handler, IDataFixEvent } from "./types";
import { unsubscribe } from "~/lib/lists";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  listId: string;
  recipientId: string;
}

const handler: Handler<IEvent> = async (event) => {
  const { tenantId, listId, recipientId } = event;
  console.log(`unsubscribing ${recipientId} from list ${listId}`);
  await unsubscribe(tenantId, listId, recipientId);
  console.log(`successfully unsubscribed`);
};

export default handler;
