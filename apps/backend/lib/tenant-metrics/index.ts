import {
  DocumentClient,
  ExpressionAttributeNameMap,
} from "aws-sdk/clients/dynamodb";

import * as dynamoDb from "~/lib/dynamo";
import { warn } from "~/lib/log";

import {
  BuildTenantMetricFn,
  ITenantMetricOperation,
  TrackTenantMetricFn,
  TrackTenantMetricsFn,
  UpdateTenantMetricsFn,
} from "./types";

const TENANT_METRICS_TABLE_NAME = process.env.TENANT_METRICS_TABLE_NAME;

// dynamo fn used by track tenant metric(s) fns below
const updateMetrics: UpdateTenantMetricsFn = async (params) => {
  const { operations, tenantId } = params;

  const allowedOperators = ["INCREMENT", "SET"];
  const expressionAttributeNames: ExpressionAttributeNameMap = {};
  const expressionAttributeValues: DocumentClient.QueryInput["ExpressionAttributeValues"] = {};
  const updateExpressions: string[] = [];

  // add updated timestamp for each operation
  expressionAttributeNames["#updated"] = "updated";
  expressionAttributeValues[":updated"] = Date.now();
  updateExpressions.push(`#updated = :updated`);

  operations.map((operation) => {
    const operator = operation.operator;
    if (!allowedOperators.includes(operator)) {
      warn(`Skipping unsupported operator: ${operation.operator}`);
      return;
    }

    // add expression attribute name(s)
    const columnKey = `${operation.metric}`;
    expressionAttributeNames[`#${columnKey}`] = columnKey;

    // add expression attribute value(s)
    const valueKey = `${columnKey}_value`;
    expressionAttributeValues[`:${valueKey}`] = operation.value;

    // generate update expression statement(s)
    switch (operation.operator.toUpperCase()) {
      case "INCREMENT":
        // :zero used for if_not_exists cases below
        expressionAttributeValues[":zero"] = 0;
        updateExpressions.push(
          `#${columnKey} = if_not_exists(#${columnKey}, :zero) + :${valueKey}`
        );
        break;
      case "SET":
        updateExpressions.push(`#${columnKey} = :${valueKey}`);
        break;
    }
  });

  try {
    await dynamoDb.update({
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Key: { tenantId },
      ReturnValues: "NONE",
      TableName: TENANT_METRICS_TABLE_NAME,
      UpdateExpression: `set ${updateExpressions.join(", ")}`,
    });
  } catch (e) {
    warn(e.message); // do not throw
  }
};

// helper fn to build tenant metric object
export const buildTenantMetricOperation: BuildTenantMetricFn = (
  metric,
  operator,
  value = 1
) => ({ metric, operator, value });

// track single metric
export const trackTenantMetric: TrackTenantMetricFn = async (
  operation,
  tenantId
) => {
  try {
    const operations: ITenantMetricOperation[] = [operation];
    await updateMetrics({
      operations,
      tenantId,
    });
  } catch (e) {
    warn(e.message);
  }
};

// track array of metrics
export const trackTenantMetrics: TrackTenantMetricsFn = async (
  operations,
  tenantId
) => {
  try {
    await updateMetrics({
      operations,
      tenantId,
    });
  } catch (e) {
    warn(e.message);
  }
};
