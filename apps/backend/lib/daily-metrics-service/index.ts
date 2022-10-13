import { DocumentClient } from "aws-sdk/clients/dynamodb";
import camelcase from "camelcase";
import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

import dynamoStoreService from "../dynamo/store-service";
import { IBatchGetFn } from "../dynamo/store-service/types";
import {
  IDailyMetrics,
  IDailyMetricsDynamo,
  IDailyMetricsKey,
  IncrementMetrics,
} from "./types";

const tableName = process.env.DAILY_METRICS_TABLE_NAME;

const service = dynamoStoreService<IDailyMetricsDynamo, IDailyMetricsKey>(
  tableName
);

export const convertDateToKey = (timestamp: Date | number) =>
  format(utcToZonedTime(timestamp, "America/Los_Angeles"), "yyyy-MM-dd");

export const batchGet: IBatchGetFn<IDailyMetrics, IDailyMetricsKey> = async (
  ...keys
) => {
  const items = await service.batchGet(...keys);

  // encapsulate all metrics fields in a `metrics` dictionary
  return items.map(({ day, tenantId, ...metrics }) => ({
    day,
    metrics,
    tenantId,
  }));
};

export const getDay = async (
  day: string,
  exclusiveStartKey?: DocumentClient.Key
) => {
  return await service.list({
    ExclusiveStartKey: exclusiveStartKey,
    ExpressionAttributeNames: {
      "#day": "day",
    },
    ExpressionAttributeValues: {
      ":day": day,
    },
    IndexName: "ByDay",
    KeyConditionExpression: "#day = :day",
    TableName: tableName,
  });
};

export const incrementMetrics: IncrementMetrics = async (
  tenantId,
  timestamp,
  ...metrics
) => {
  const key = {
    day: convertDateToKey(timestamp),
    tenantId,
  };

  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  const updateExpressions = [];

  for (const tuple of metrics) {
    const metric = typeof tuple === "string" ? tuple : tuple[0];
    const increment = typeof tuple === "string" ? 1 : tuple[1];

    const attributeName = camelcase(metric);
    expressionAttributeNames[`#${attributeName}`] = metric;
    expressionAttributeValues[`:${attributeName}Increment`] = increment;
    updateExpressions.push(`#${attributeName} :${attributeName}Increment`);
  }

  const query = {
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    Key: key,
    ReturnValues: "NONE",
    TableName: tableName,
    UpdateExpression: `ADD ${updateExpressions.join(", ")}`,
  };

  await service.dynamodb.update(query);
};
