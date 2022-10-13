import { NotFound } from "~/lib/http-errors";
import s3 from "~/lib/s3";
import {
  IEventReprocessorPayload,
  IEventReprocessorPayloadInput,
} from "~/reprocessors/types/events";

const store = s3<IEventReprocessorPayload>(process.env.REPROCESSOR_STORE);

export default store;

const getJsonStoreKey = (
  tenantId: string,
  messageId: string,
  type: string,
  ts: number
) => {
  return `${tenantId.replace("/", "-")}-${messageId}/${type.replace(
    ":",
    "_"
  )}_${ts}.json`;
};

export const putJson = async (
  json: IEventReprocessorPayload
): Promise<void> => {
  const { tenantId, messageId, type, ts } = json.input;
  await store.put(getJsonStoreKey(tenantId, messageId, type, ts), json);
};

export const getJson = async (
  input: IEventReprocessorPayloadInput
): Promise<IEventReprocessorPayload> => {
  const { tenantId, messageId, type, ts } = input;
  const jsonStoreKey = getJsonStoreKey(tenantId, messageId, type, ts);

  try {
    return await store.get(jsonStoreKey);
  } catch (err) {
    if (err instanceof NotFound) {
      return;
    }
    throw err;
  }
};
