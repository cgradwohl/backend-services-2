import getRetentionLimit from "../get-retention-limit";
import createMessages from "./create-messages";
import { IMessageLog } from "./types";

const getById = async (tenantId: string, id: string): Promise<IMessageLog> => {
  // TODO: remove retention limit when C-1927 ships
  const retentionLimit = getRetentionLimit(tenantId);
  const [result] = await createMessages(tenantId, id, true);

  return result.enqueued > retentionLimit ? result : null;
};

export default getById;
