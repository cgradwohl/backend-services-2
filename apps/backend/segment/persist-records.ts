import { KinesisStreamRecord } from "aws-lambda";
import { createEventHandlerWithoutSequenceChecking } from "~/lib/kinesis/create-event-handler";
import kinesisToJson from "~/lib/kinesis/to-json";
import logger from "~/lib/logger";

import requests from "~/tracking-requests/services/tracking-requests";
import incomingSegmentEventsFactory from "./services/incoming-events";
import { IRecord } from "./types";

export const handleRecord = async (record: KinesisStreamRecord) => {
  const item = kinesisToJson<IRecord>(record.kinesis.data);
  const {
    dryRunKey,
    scope,
    tenantId,
    trackingId: messageId,
    shouldUseInboundSegmentEventsKinesis,
  } = item;
  const request = await requests(tenantId, scope, dryRunKey).get(
    messageId,
    shouldUseInboundSegmentEventsKinesis
  );
  const incomingEventsService = incomingSegmentEventsFactory(tenantId);
  const body = request.data;

  if (await incomingEventsService.shouldKeepHistory(body)) {
    logger.debug(`[${messageId}] persisting segment message`);
    await incomingEventsService.put(body);
  }
};

export const handle = createEventHandlerWithoutSequenceChecking(handleRecord);
