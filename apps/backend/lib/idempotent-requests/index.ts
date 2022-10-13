import add from "date-fns/add";
import * as dynamo from "../dynamo";
import {
  DuplicateIdempotentRequestError,
  GetFn,
  IIdempotentRequest,
  PutFn,
  UpdateFn,
} from "./types";

export const get: GetFn = async (tenantId, idempotencyKey) => {
  // lookup v2
  const results = await dynamo.getItem({
    Key: {
      pk: `${tenantId}/${idempotencyKey}`,
    },
    TableName: process.env.IDEMPOTENT_REQUESTS_V2_TABLE_NAME,
  });
  const item = results.Item as IIdempotentRequest;

  const now = Math.floor(Date.now() / 1000);

  if (!item || item?.ttl < now) {
    // ttl has expired. treat it as not found
    return undefined;
  }

  return item;
};

export const put: PutFn = async (
  tenantId,
  idempotencyKey,
  { body, statusCode },
  options = {}
) => {
  const now = Date.now();

  // Take the smaller value up to a year of ttl
  const proposedTtl = Math.min(
    (options?.ttl ?? 0) / 1000,
    Math.floor(add(now, { years: 1 }).getTime() / 1000)
  );

  // Take the larger value between proposed ttl or 24 hours in epoch time
  const ttl = Math.max(
    proposedTtl,
    Math.floor(add(now, { days: 1 }).getTime() / 1000)
  );

  try {
    await dynamo.put({
      ConditionExpression: "attribute_not_exists(pk) OR #ttl < :now",
      ExpressionAttributeNames: {
        "#ttl": "ttl",
      },
      ExpressionAttributeValues: {
        ":now": Math.floor(now / 1000), // epoch time
      },
      Item: {
        body,
        idempotencyKey,
        pk: `${tenantId}/${idempotencyKey}`,
        statusCode,
        tenantId,
        ttl,
      },
      TableName: process.env.IDEMPOTENT_REQUESTS_V2_TABLE_NAME,
    });
  } catch (err) {
    if (err?.code === "ConditionalCheckFailedException") {
      throw new DuplicateIdempotentRequestError();
    }
    throw err;
  }

  return {
    body,
    idempotencyKey,
    statusCode,
    tenantId,
    ttl,
  };
};

export const update: UpdateFn = async (
  tenantId,
  idempotencyKey,
  { body, statusCode }
) => {
  await dynamo.update({
    ExpressionAttributeNames: {
      "#body": "body",
      "#statusCode": "statusCode",
    },
    ExpressionAttributeValues: {
      ":body": body,
      ":statusCode": statusCode,
    },
    Key: {
      pk: `${tenantId}/${idempotencyKey}`,
    },
    UpdateExpression: "SET #body = :body, #statusCode = :statusCode",

    TableName: process.env.IDEMPOTENT_REQUESTS_V2_TABLE_NAME,
  });
};
