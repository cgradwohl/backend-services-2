import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getDocClient } from "~/auditing/lib/doc-client";
import getEnvVar from "~/lib/get-environment-variable";

const docClient = getDocClient();
const AUDIT_EVENTS_TABLE = getEnvVar("AUDIT_EVENTS_TABLE");

export * as AuditEventStoreTypes from "./types";

export async function putItem<T>(item: T) {
  const params: DocumentClient.PutItemInput = {
    Item: {
      ...item,
    },
    TableName: AUDIT_EVENTS_TABLE,
  };
  await docClient.put(params).promise();
}
