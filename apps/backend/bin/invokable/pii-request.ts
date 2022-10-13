import { Handler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import * as dynamo from "~/lib/dynamo";
import { getLogs } from "~/lib/dynamo/event-logs";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { search as searchMessages } from "~/lib/elastic-search/messages";
import jsonStore from "~/lib/s3";
import { PartialMessage } from "~/types.api";

interface IEvent {
  email: string;
}

interface IPIIRequestOutput {
  messages: [];
  profiles: [];
}

const { put: createJsonFile } = jsonStore<IPIIRequestOutput>(
  process.env.OUTPUT_S3_BUCKET
);

const INCLUDED_LOG_ENTRIES = ["event:received", "profile:loaded"];
const appendLogs = async (messages: PartialMessage[]) => {
  return await Promise.all(
    messages.map(async (message) => {
      const logs = await getLogs(message.tenantId, message.messageId);

      return {
        ...message,
        logs: logs.filter((log) => INCLUDED_LOG_ENTRIES.includes(log.type)),
      };
    })
  );
};

const getProfiles = async (
  email: string,
  exclusiveStartKey?: DocumentClient.Key
) => {
  const response = await dynamo.scan({
    ExclusiveStartKey: exclusiveStartKey,
    ExpressionAttributeNames: {
      "#id": "id",
      "#json": "json",
    },
    ExpressionAttributeValues: {
      ":email": email,
    },
    FilterExpression: "#id = :email OR contains(#json, :email)",
    TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
  });

  if (!response.LastEvaluatedKey) {
    return response.Items;
  }

  return [
    ...response.Items,
    ...(await getProfiles(email, response.LastEvaluatedKey)),
  ];
};

const getSentMessages = async (email: string, next?: string) => {
  const response = await searchMessages({
    next,
    recipient: email,
  });
  const withLogs = await appendLogs(response.messages);

  if (!response.next) {
    return withLogs;
  }

  return [...withLogs, ...(await getSentMessages(email, response.next))];
};

export const handler: Handler<IEvent> = async (event) => {
  const email = event.email;

  if (!email) {
    throw new Error("Email is required to perform a lookup.");
  }

  const profiles = await getProfiles(email);
  const messages = await getSentMessages(email);

  const filename = `${email}-${new Date().toISOString()}.json`;
  await createJsonFile(filename, {
    messages,
    profiles,
  });
  return filename;
};
