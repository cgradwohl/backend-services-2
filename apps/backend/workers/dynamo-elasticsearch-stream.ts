import { DynamoDBRecord } from "aws-lambda";
import * as dynamodb from "~/lib/dynamo";
import { createStreamHandlerWithoutSequenceChecking } from "~/lib/dynamo/create-stream-handler";
import elasticSearch from "~/lib/elastic-search";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { DynamoDB } from "aws-sdk";

const endpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const index = process.env.ELASTIC_SEARCH_INDEX;
const idAttribute = process.env.ELASTIC_SEARCH_ID_ATTRIBUTE || "id";

const es = elasticSearch(endpoint, index);

export const DROP_ITEM = Symbol("DROP_ITEM");

const handleStreamRecord = async (
  record: DynamoDBRecord,
  callback: (item: DocumentClient.AttributeMap) => any
): Promise<void> => {
  const key = DynamoDB.Converter.unmarshall(record.dynamodb.Keys);
  const id = key[idAttribute];
  const escapedId = escape(id);

  if (record.eventName === "REMOVE") {
    await es.delete(escapedId);
    return;
  }

  const { Item: item } = await dynamodb.getItem({
    ConsistentRead: true,
    Key: key,
    TableName: getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME),
  });

  const doc = callback ? callback(item) : item;
  if (!doc || doc === DROP_ITEM) {
    return;
  }
  return es.put(escapedId, doc);
};

const callback = (item: DocumentClient.AttributeMap) => {
  const cleaned = { ...item };

  if (typeof item.recipientId !== "string") {
    cleaned.recipientId = JSON.stringify(item.recipientId);
  }

  if (typeof item.recipientEmail !== "string") {
    cleaned.recipientEmail = JSON.stringify(item.recipientEmail);
  }

  return cleaned;
};

export default createStreamHandlerWithoutSequenceChecking(
  async (record: DynamoDBRecord) => {
    await handleStreamRecord(record, callback);
  }
);
