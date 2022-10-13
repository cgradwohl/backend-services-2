import { Agent } from "https";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import logger from "~/lib/logger";
import uuid from "uuid";

const agent = new Agent({
  keepAlive: true,
  maxSockets: 30,
  rejectUnauthorized: true,
});

export const getDocClient = () =>
  new DocumentClient({
    httpOptions: {
      agent,
      connectTimeout: 15000,
      timeout: 5000,
    },
    maxRetries: 3,
  });

const docClient = getDocClient();

const debugQueryArgs = <T extends object>(obj: T): T => {
  logger.debug(obj);
  return obj;
};

export async function getItem(
  args: DocumentClient.GetItemInput
): Promise<DocumentClient.GetItemOutput> {
  return docClient.get(debugQueryArgs(args)).promise();
}

export function id(): string {
  return uuid();
}

export async function put(
  args: DocumentClient.PutItemInput
): Promise<DocumentClient.PutItemOutput> {
  return docClient.put(debugQueryArgs(args)).promise();
}

export async function query(
  args: DocumentClient.QueryInput
): Promise<DocumentClient.QueryOutput> {
  return docClient.query(debugQueryArgs(args)).promise();
}

export async function update(
  args: DocumentClient.UpdateItemInput
): Promise<DocumentClient.UpdateItemOutput> {
  return docClient.update(debugQueryArgs(args)).promise();
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
