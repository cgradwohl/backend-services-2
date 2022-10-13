import * as dynamoUtil from "~/audiences/util/dynamo";
import { getDocClient } from "~/audiences/lib/doc-client";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export * as StoreTypes from "./types";
const docClient = getDocClient();

export async function putItem<T>(item: T) {
  const params: DocumentClient.PutItemInput = {
    Item: {
      ...item,
    },
    TableName: dynamoUtil.AUDIENCES_TABLE_NAME,
  };
  await docClient.put(params).promise();
}

export async function updateItem<T>(
  updateQuery: Partial<DocumentClient.UpdateItemInput>
): Promise<T> {
  const { Attributes } = await docClient
    .update({
      ...(updateQuery as DocumentClient.UpdateItemInput),
      ReturnValues: "ALL_NEW",
      TableName: dynamoUtil.AUDIENCES_TABLE_NAME,
    })
    .promise();

  return Attributes as T;
}

export async function getItem<T>(key: DocumentClient.Key): Promise<T> {
  const params = {
    TableName: dynamoUtil.AUDIENCES_TABLE_NAME,
    Key: {
      ...key,
    },
  };
  const response = await docClient.get(params).promise();
  return response.Item as T;
}

export async function deleteItem(key: DocumentClient.Key) {
  const params: DocumentClient.DeleteItemInput = {
    TableName: dynamoUtil.AUDIENCES_TABLE_NAME,
    Key: {
      ...key,
    },
  };
  await docClient.delete(params).promise();
}

export async function query(
  args: DocumentClient.QueryInput
): Promise<DocumentClient.QueryOutput> {
  return docClient.query(args).promise();
}
