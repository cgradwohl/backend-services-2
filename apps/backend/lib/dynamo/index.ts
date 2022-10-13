import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";
import logger from "~/lib/logger";
import AWS from "../aws-sdk";
import { Agent } from "https";

const agent = new Agent({
  keepAlive: true,
  maxSockets: Infinity,
  rejectUnauthorized: true,
});

export const docClient = new AWS.DynamoDB.DocumentClient({
  httpOptions: {
    agent,
    connectTimeout: 10000,
    timeout: 5000,
  },
  maxRetries: 3,
});

const debugQueryArgs = <T extends object>(obj: T): T => {
  logger.debug(obj);
  return obj;
};

export function createSet(
  list: Parameters<typeof docClient.createSet>[0],
  options?: Parameters<typeof docClient.createSet>[1]
): DocumentClient.DynamoDbSet {
  return docClient.createSet(list, options);
}

export function id(): string {
  return uuid();
}

export async function scan(args: DocumentClient.ScanInput) {
  return docClient.scan(debugQueryArgs(args)).promise();
}

export async function put(
  args: DocumentClient.PutItemInput
): Promise<DocumentClient.PutItemOutput> {
  return docClient.put(debugQueryArgs(args)).promise();
}

export async function update(
  args: DocumentClient.UpdateItemInput
): Promise<DocumentClient.UpdateItemOutput> {
  return docClient.update(debugQueryArgs(args)).promise();
}

export async function getItem(
  args: DocumentClient.GetItemInput
): Promise<DocumentClient.GetItemOutput> {
  return docClient.get(debugQueryArgs(args)).promise();
}

export async function query(
  args: DocumentClient.QueryInput
): Promise<DocumentClient.QueryOutput> {
  return docClient.query(debugQueryArgs(args)).promise();
}

export async function batchGet(
  args: DocumentClient.BatchGetItemInput
): Promise<DocumentClient.BatchGetItemOutput> {
  return docClient.batchGet(debugQueryArgs(args)).promise();
}

export async function batchWrite(
  args: DocumentClient.BatchWriteItemInput
): Promise<DocumentClient.BatchWriteItemOutput> {
  return docClient.batchWrite(debugQueryArgs(args)).promise();
}

export async function deleteItem(
  args: DocumentClient.DeleteItemInput
): Promise<DocumentClient.DeleteItemOutput> {
  return docClient.delete(debugQueryArgs(args)).promise();
}

export async function transactWrite(
  args: DocumentClient.TransactWriteItemsInput
): Promise<DocumentClient.TransactWriteItemsOutput> {
  return docClient.transactWrite(debugQueryArgs(args)).promise();
}
