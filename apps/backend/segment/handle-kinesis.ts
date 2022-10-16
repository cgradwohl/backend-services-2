import logger from "~/lib/logger";
import { identifyInbound } from "./identify";
import { trackInbound } from "./track";
import { InboundSegmentRequestTypesEnum, IRecord } from "./types";

import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import requests from "~/tracking-requests/services/tracking-requests";

export const handleRecord = async (record: IRecord) => {
  const {
    dryRunKey,
    scope,
    tenantId,
    trackingId: messageId,
    shouldUseInboundSegmentEventsKinesis,
  } = record;
  const request = await requests(tenantId, scope, dryRunKey).get(
    messageId,
    shouldUseInboundSegmentEventsKinesis
  );
  const body = request.data;

  const context = {
    messageId,
    tenantId,
    scope,
    dryRunKey,
    event: {
      ...record,
      headers: {
        "idempotency-key": body.messageId,
      },
      body,
    },
  };

  logger.debug(`[${messageId}] handling segment message`);

  switch (body.type) {
    case InboundSegmentRequestTypesEnum.IDENTIFY:
      await identifyInbound(context);
      break;

    case InboundSegmentRequestTypesEnum.GROUP:
      // group doesn't do anything yet
      // await groupInbound(context);
      break;

    case InboundSegmentRequestTypesEnum.TRACK:
      await trackInbound(context);
      break;
  }
};

export const handle = createEventHandlerWithFailures<IRecord>(
  handleRecord,
  process.env.TRACKING_REQUEST_SEQUENCE_TABLE
);
