/**
 * NB: If you are adding a new event type to be processed by this function you
 * will need to update the filtering mechanisms in two places
 * 1) The serverless.yml filterPatterns entry for the UpdateMessageChannels function
 * 2) Add the event type to the `SUPPORTED` array of items used for filtering
 */

import { createSet, update as updateItem } from "~/lib/dynamo";
import {
  getJsonValue,
  migrateLegacyEventLogJson,
} from "~/lib/dynamo/event-logs";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import messagesServiceApiV1 from "~/messages/service/api-v1";
import { MessageNotFoundError } from "~/messages/service/api-v1/errors";
import { EventLogEntryType, FullMessage } from "~/types.api";
import { ISafeEventLogEntry } from "~/types.internal";

const SUPPORTED: EventLogEntryType[] = [
  "provider:delivered",
  "provider:error",
  "provider:sent",
  "provider:simulated",
  "undeliverable",
  "unroutable",
];

const MessagesV2TableName = getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME);

async function handler(event: ISafeEventLogEntry) {
  // keeping this just as a safety precaution. this should never happen.
  if (!SUPPORTED.includes(event.type)) {
    return;
  }

  const json = await getJsonValue(migrateLegacyEventLogJson(event.json));
  const { channel, provider } = json;

  if (!channel && !provider) {
    // no relevant data to update
    return;
  }

  // NOTE: V2 Messages do not have a concept of channels yet
  const channels: FullMessage["channels"] = channel
    ? createSet([channel.taxonomy])
    : createSet([""]);
  const providers: FullMessage["providers"] = provider
    ? createSet([provider])
    : createSet([""]);

  try {
    // attempt v3
    const messages = messagesServiceApiV1(event.tenantId);
    await messages.update(event.messageId, {
      ExpressionAttributeNames: {
        "#channels": "channels",
        "#providers": "providers",
      },
      ExpressionAttributeValues: {
        ":channels": channels,
        ":providers": providers,
      },
      UpdateExpression: "ADD #channels :channels, #providers :providers",
    });
  } catch (err) {
    // fallback on v2
    if (err instanceof MessageNotFoundError) {
      await updateItem({
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeNames: {
          "#channels": "channels",
          "#providers": "providers",
        },
        ExpressionAttributeValues: {
          ":channels": channels,
          ":providers": providers,
        },
        Key: {
          id: event.messageId,
          tenantId: event.tenantId,
        },
        TableName: MessagesV2TableName,
        UpdateExpression: "ADD #channels :channels, #providers :providers",
      });
      return;
    }
    throw err;
  }
}

export default createEventHandlerWithFailures<ISafeEventLogEntry>(
  handler,
  process.env.EVENT_LOG_SEQUENCE_TABLE,
  {
    filter: (event: ISafeEventLogEntry) => SUPPORTED.includes(event.type),
  }
);
