import { putDirectorySyncTenantMap } from "~/lib/workos/directory-sync/directory-sync-table";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  directoryId: string;
}

const handler: Handler<IEvent> = async (event) => {
  const { tenantId, directoryId } = event;
  await putDirectorySyncTenantMap(directoryId, tenantId);
};

export default handler;
