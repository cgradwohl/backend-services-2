import { handleListOrPatternSendRequest } from "~/api/lists/send";
import { handleSendRequest } from "~/api/send";
import { get as getEventMap } from "~/lib/event-maps";
import { BadRequest } from "~/lib/http-errors";
import { assertBody } from "~/lib/lambda-response";
import logger from "~/lib/logger";
import { DuplicateMessageIdError } from "~/messages/service/api-v1/errors";
import { AlreadyExistsSendError } from "~/send/errors";

import { IApiError } from "~/types.public";
import { IInboundSegmentTrackRequest } from "../types";

const prefix = "Segment-TrackEvent";

const transformBody = (body: any) => {
  return {
    data: body,
    event: `${prefix}:${body.event}`,
    recipient: body.userId || body.anonymousId,
  };
};

const transformBodyTopicOrPattern = (
  body: any,
  list: string,
  pattern: string
) => {
  const base = {
    data: body,
    event: `${prefix}:${body.event}`,
  };

  return list ? { ...base, list } : { ...base, pattern };
};

export const trackInbound = async (context) => {
  const { messageId } = context;
  const body = assertBody<IInboundSegmentTrackRequest>(context);

  // support added for trigger list or pattern
  // sends via inbound segment events
  const sendByList = body?.properties?.courier?.list;
  const sendByPattern = body?.properties?.courier?.pattern;

  if (sendByList || sendByPattern) {
    context.event.body = transformBodyTopicOrPattern(
      body,
      sendByList,
      sendByPattern
    );

    try {
      await handleListOrPatternSendRequest({ context, messageId });
      return;
    } catch (err) {
      if (err instanceof BadRequest) {
        // tslint:disable-next-line: no-console
        console.warn(`List not found ${sendByList}. Retry will not occur.`);
        return;
      }

      throw err;
    }
  }

  context.event.body = transformBody(body);

  const eventMap = await getEventMap({
    eventId: context.event?.body?.event,
    tenantId: context.tenantId,
  });

  if (!eventMap?.notifications?.length) {
    logger.debug("No event map found for event", {
      eventId: context.event?.body?.event,
      tenantId: context.tenantId,
    });

    return;
  }

  try {
    const apiError: IApiError = await handleSendRequest({
      context: {
        ...context,
        translateToV2: false,
        shouldTranslateAndDeliver: false,
      },
      messageId,
    });

    if (apiError) {
      console.warn(
        `Could not createMessage: ${messageId} ${JSON.stringify(
          apiError,
          null,
          2
        )}`
      );
    }
  } catch (err) {
    if (err instanceof DuplicateMessageIdError) {
      // swallow this error, we already log information in the service about it
      return;
    }

    if (err instanceof AlreadyExistsSendError) {
      return;
    }

    throw err;
  }
};
