import { DynamoDBRecord } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import * as dynamodb from "~/lib/dynamo";
import { createStreamHandlerWithoutSequenceChecking } from "~/lib/dynamo/create-stream-handler";
import elasticSearch from "~/lib/elastic-search";

const endpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const index = process.env.ELASTIC_SEARCH_INDEX ?? "messages";

const es = elasticSearch(endpoint, index);

export const DROP_ITEM = Symbol("DROP_ITEM");

const handleStreamRecord = async (
  record: DynamoDBRecord,
  callback: (item: DocumentClient.AttributeMap) => any
): Promise<void> => {
  if (record.eventName === "REMOVE") {
    const { messageId } = DynamoDB.Converter.unmarshall(
      record.dynamodb.OldImage
    );
    await es.delete(escape(messageId));
    return;
  }

  const key = DynamoDB.Converter.unmarshall(record.dynamodb.Keys);
  const { Item: item } = await dynamodb.getItem({
    ConsistentRead: true,
    Key: key,
    TableName: process.env.MESSAGES_V3_TABLE,
  });

  const doc = callback ? callback(item) : item;
  if (!doc || doc === DROP_ITEM) {
    return;
  }

  const escapedId = escape(doc.messageId);
  return es.put(escapedId, doc);
};

const callback = (item: DocumentClient.AttributeMap) => {
  if (!item) {
    return;
  }

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
