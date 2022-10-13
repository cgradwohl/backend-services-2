import { KinesisStreamRecord } from "aws-lambda";
import { createEventHandlerWithoutSequenceChecking } from "~/lib/kinesis/create-event-handler";
import kinesisToJson from "~/lib/kinesis/to-json";
import logger from "~/lib/logger";

import requests from "~/tracking-requests/services/tracking-requests";
import { ITrackingRequest } from "~/tracking-requests/types";

import incomingSegmentEventsFactory from "./services/incoming-events";

type IRecord = Pick<
  ITrackingRequest,
  "dryRunKey" | "scope" | "tenantId" | "trackingId"
>;

export const handleRecord = async (record: KinesisStreamRecord) => {
  const item = kinesisToJson<IRecord>(record.kinesis.data);
  const { dryRunKey, scope, tenantId, trackingId: messageId } = item;
  const request = await requests(tenantId, scope, dryRunKey).get(messageId);
  const incomingEventsService = incomingSegmentEventsFactory(tenantId);
  const body = request.data;

  if (await incomingEventsService.shouldKeepHistory(body)) {
    logger.debug(`[${messageId}] persisting segment message`);
    await incomingEventsService.put(body);
  }
};

export const handle = createEventHandlerWithoutSequenceChecking(handleRecord);
