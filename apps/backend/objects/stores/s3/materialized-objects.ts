import { NotFound } from "~/lib/http-errors";
import s3 from "~/lib/s3";

const store = s3<any>(process.env.MATERIALIZED_OBJECTS_JSON_STORE);

export default store;

export const getJson = async (tenantId: string, objectId: string) => {
  const jsonStoreKey = getJsonStoreKey(tenantId, objectId);

  try {
    const json = await store.get(jsonStoreKey);
    return json;
  } catch (err) {
    if (err instanceof NotFound) {
      return;
    }
    throw err;
  }
};

export const getJsonStoreKey = (tenantId: string, objectId: string) =>
  `${tenantId}/${objectId}/${objectId}.json`;

export const putJson = async (
  tenantId: string,
  objectId: string,
  json: any
) => {
  const jsonStoreKey = getJsonStoreKey(tenantId, objectId);
  await store.put(jsonStoreKey, json);
};
