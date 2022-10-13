import { sendListOrPattern } from "~/api/lists/send";
import enqueue from "~/lib/enqueue";
import { list as getLists } from "~/lib/lists";
import logger from "~/lib/logger";

import {
  S3SendListOrPatternMessage,
  SqsSendListOrPatternMessage,
} from "~/types.internal";
import { ApiSendListOrPatternRequest } from "~/types.public";

const enqueueSendListOrPatternMessage = enqueue<SqsSendListOrPatternMessage>(
  process.env.SQS_SEND_LIST_OR_PATTERN_QUEUE_NAME
);

export default async (
  body: SqsSendListOrPatternMessage,
  message: S3SendListOrPatternMessage
) => {
  try {
    const bodyLastEvaluatedKey = body?.lastEvaluatedKey;
    const pattern = message.pattern;
    const tenantId = body.tenantId;

    // get lists
    const { lastEvaluatedKey, items: lists } = await getLists(tenantId, {
      exclusiveStartKey: bodyLastEvaluatedKey,
      pattern,
    });
    // use head recursion to optimize overall execution time, if more exist
    if (lastEvaluatedKey) {
      await enqueueSendListOrPatternMessage({
        ...body,
        lastEvaluatedKey,
      });
    }

    const listBody: ApiSendListOrPatternRequest = {
      brand: message.brand?.id,
      data: message.eventData,
      data_source: message.dataSource,
      event: message.eventId,
      list: message.list?.id,
      pattern: message.pattern,
      preferences: message.eventPreferences,
    };

    await Promise.all(
      lists.map(async (list) => {
        await sendListOrPattern(
          listBody,
          message.brand,
          message.eventData,
          message.eventId,
          body.messageId,
          message.override,
          tenantId,
          list,
          pattern,
          body.originalMessageId,
          message.dryRunKey,
          message.scope,
          message.eventPreferences
        );
      })
    );
  } catch (e) {
    logger.error(e);
  }
};
