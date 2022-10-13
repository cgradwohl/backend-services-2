import { NotFound } from "~/lib/http-errors";
import s3 from "~/lib/s3";
import { ISendMessageContext } from "~/send/types";

const store = s3<ISendMessageContext>(process.env.ACTION_STREAM_BUCKET!);

const getStoreKey = ({
  context,
  key,
  requestId,
  messageId,
}: {
  context: ISendMessageContext;
  key: string;
  requestId: string;
  messageId: string;
}) => {
  const { tenant } = context;
  return `${tenant.tenantId.replace(
    "/",
    "-"
  )}-${requestId}/${messageId}/${key}`;
};

export const get = async ({
  context,
  key,
  requestId,
  messageId,
}: {
  context: ISendMessageContext;
  key: string;
  requestId: string;
  messageId: string;
}) => {
  const jsonStoreKey = getStoreKey({ context, key, requestId, messageId });

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

export const put = async ({
  context,
  key,
  json,
  requestId,
  messageId,
}: {
  context: ISendMessageContext;
  key: string;
  json: any;
  requestId: string;
  messageId: string;
}) => {
  const jsonStoreKey = getStoreKey({ context, key, requestId, messageId });
  await store.put(jsonStoreKey, json);
};
