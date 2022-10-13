import * as dynamodb from "../dynamo";
import dynamoObjectService, {
  ObjectAlreadyExistsError,
} from "../dynamo/object-service";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import { IRateLimit, IRateLimitsService, RateLimitType } from "./types";

const TITLE = "Rate Limits";
const objType = "rate-limit";
const rateLimits = dynamoObjectService<IRateLimit>(objType);

const get = rateLimits.get;
const remove = rateLimits.remove;
// Tries to create a new Rate Limit
// If it already exists, check if we need to force expire the rate limit
//   true -> Tries to reset the points and expires date
//   false -> Tries to reset the points and expires date if expires date stored is <= now
// If either update fails, tries to increment the points used
const upsert: IRateLimitsService["upsert"] = async (params, obj) => {
  let result: IRateLimit;

  try {
    const payload = {
      id: params.id,
      json: { points: obj.points, expires: obj.newExpire },
      title: TITLE,
    };

    const value = await rateLimits.create(params, payload, {
      serialize: false,
    });

    result = value.json;
  } catch (err) {
    if (!(err instanceof ObjectAlreadyExistsError)) {
      throw err;
    }

    const updated = Date.now();

    try {
      const { Attributes } = await updateRateLimit(
        params.id,
        obj.points,
        obj.newExpire,
        params.tenantId,
        params.userId,
        updated,
        obj.forceExpire
      );

      result = Attributes?.json;
    } catch (err) {
      if (err?.code !== "ConditionalCheckFailedException") {
        throw err;
      }

      const { Attributes } = await updatePoints(
        params.id,
        obj.points,
        params.tenantId
      );

      result = Attributes?.json;
    }
  }

  return result;
};

const updateRateLimit = async (
  id: string,
  points: number,
  expires: number,
  tenantId: string,
  userId: string,
  updated: number,
  forceExpire: boolean
) =>
  update(
    forceExpire
      ? "attribute_exists(id)"
      : "attribute_exists(id) AND json.#expires <= :updated",
    {
      "#expires": "expires",
      "#points": "points",
    },
    {
      ":expires": expires,
      ":points": points,
      ":updated": updated,
      ":updater": userId,
    },
    { id, tenantId }
  );

const updatePoints = async (id: string, points: number, tenantId: string) =>
  update(
    "attribute_exists(id)",
    { "#points": "points" },
    {
      ":points": points,
    },
    { id, tenantId }
  );

// Runs the update statement for Rate Limits
// If expires provided, sets expires, points, and updated info.
// Otherwise, increment points.
const update = async (
  conditionExpression: string,
  expressionAttributeNames: { [key: string]: string },
  expressionAttributeValues: { [key: string]: string | number },
  key: { id: string; tenantId: string }
) => {
  const updateExpression = expressionAttributeValues[":expires"]
    ? "set json.#expires = :expires, json.#points = :points, updated = :updated, updater = :updater"
    : "set json.#points = json.#points + :points";

  return dynamodb.update({
    ConditionExpression: conditionExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    Key: key,
    ReturnValues: "ALL_NEW",
    TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
    UpdateExpression: updateExpression,
  });
};

export const createKey = (
  segment: "email" | "tenant-id" | "ip",
  id: string,
  type: RateLimitType
) => {
  return `rate-limit/${
    ["email", "ip"].includes(segment) ? "" : `${segment}/`
  }${id}/${type}`;
};

const service: IRateLimitsService = {
  get,
  remove,
  upsert,
};

export default service;
