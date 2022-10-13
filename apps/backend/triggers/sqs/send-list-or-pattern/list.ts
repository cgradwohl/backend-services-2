// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { saveAndEnqueue as saveAndEnqueuePrepare } from "~/api/send";
import { getEventDataByRecipient } from "~/lib/data-source/get-event-data-by-recipient";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import { create as createMessage } from "~/lib/dynamo/messages";
import enqueue from "~/lib/enqueue";
import { put as putIdempotencyKey } from "~/lib/idempotent-requests";
import { DuplicateIdempotentRequestError } from "~/lib/idempotent-requests/types";
import { getSubscriptions } from "~/lib/lists";
import logger from "~/lib/logger";
import createTraceId from "~/lib/x-ray/create-trace-id";

import { JSONObject } from "~/types.api";
import {
  S3PrepareMessage,
  S3SendListOrPatternMessage,
  SqsSendListOrPatternMessage,
} from "~/types.internal";
import {
  ApiSendListOrPatternRequest,
  IProfilePreferences,
} from "~/types.public";

const enqueueSendListOrPatternMessage = enqueue<SqsSendListOrPatternMessage>(
  process.env.SQS_SEND_LIST_OR_PATTERN_QUEUE_NAME
);

interface IListMessageLogEntryBody extends ApiSendListOrPatternRequest {
  data: JSONObject;
  recipient: string;
}

export default async (
  body: SqsSendListOrPatternMessage,
  message: S3SendListOrPatternMessage
) => {
  try {
    const bodyLastEvaluatedKey = body?.lastEvaluatedKey;
    const tenantId = body.tenantId;

    // get list subscriptions
    const { lastEvaluatedKey, items: subscriptions } = await getSubscriptions(
      tenantId,
      message.list.id,
      {
        exclusiveStartKey: bodyLastEvaluatedKey,
        limit: 100,
      }
    );

    // use head recursion to optimize overall execution time, if more exist
    if (lastEvaluatedKey) {
      await enqueueSendListOrPatternMessage({
        ...body,
        lastEvaluatedKey,
      });
    }

    // handle each list subscriber
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          /*
            attempt to write a composite key constructed of:
              - origin send list pattern message id
              - recipient id

            this will write the key for both "send to list" and
            "send to list pattern", however it will only fail for
            pattern-based sends.

            this ensures that when sending across multiple lists, recipients
            only receive that message ONCE.
          */
          await putIdempotencyKey(
            tenantId,
            `${body.originalMessageId}/${subscription.recipientId}`,
            { body: "", statusCode: 200 }
          );

          // TODO: Remove if we don't serliaze to string.
          const { preferences: subscriptionPreferences } =
            typeof subscription.json === "string"
              ? JSON.parse(subscription.json)
              : subscription.json;

          const listPreferences = message.list?.preferences;
          const runtimePreferencesOverride = message.eventPreferences;
          const eventPreferences = jsonMerger.mergeObjects(
            [
              listPreferences,
              subscriptionPreferences,
              runtimePreferencesOverride,
            ].filter(Boolean)
          );

          const eventData = await getEventDataByRecipient(
            subscription.recipientId,
            message.eventData,
            message.dataSource
          );

          // construct message for prepare queue
          const event: S3PrepareMessage = {
            ...message,
            eventData,
            eventPreferences,
            recipientId: subscription.recipientId,
          };

          // enqueue for prepare worker using composite key that will
          // allow easy organization of logs across a list
          const messageId = createTraceId();

          await createMessage(
            tenantId,
            event.eventId,
            event.recipientId,
            messageId,
            message.pattern,
            message.list.id,
            body.messageId
          );

          await saveAndEnqueuePrepare(messageId, tenantId, event);

          const logEntryBody: IListMessageLogEntryBody = {
            brand: message.brand?.id,
            data: event.eventData ?? message.eventData,
            data_source: message.dataSource,
            event: message.eventId,
            list: message.list.id,
            override: message.override,
            pattern: message.pattern,
            preferences: event.eventPreferences,
            recipient: event.recipientId,
          };

          await createLogEntry(tenantId, messageId, EntryTypes.eventReceived, {
            body: logEntryBody,
          });
        } catch (e) {
          // do not throw, continue processing next recipient
          if (!(e instanceof DuplicateIdempotentRequestError)) {
            logger.error(e);
          }
          // todo: check for custom error or ConditionalCheckFailedException error, if it is not that type then delete idempotency key
        }
      })
    );
  } catch (e) {
    logger.error(e);
  }
};
