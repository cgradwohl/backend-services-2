import uuid from "uuid";

import jsonStore from "~/lib/s3";
import enqueue from "../enqueue";
import { getFeatureUserVariation } from "../get-launch-darkly-flag";
import { CourierLogger } from "~/lib/logger";
import { Group, ISqsSegmentEvent, ITrack } from "./types";

let enqueueSegmentEvent;
let putEvent;
const s3SegmentEventsBucket = process.env.S3_SEGMENT_EVENTS_BUCKET;
const sqsSegmentEventsQueueName = process.env.SQS_SEGMENT_EVENTS_QUEUE_NAME;
const { logger } = new CourierLogger("Segment");

try {
  enqueueSegmentEvent = enqueue<ISqsSegmentEvent>(sqsSegmentEventsQueueName);
  const { put } = jsonStore<ISqsSegmentEvent>(s3SegmentEventsBucket);
  putEvent = put;
} catch (e) {
  logger.error(e && e.message ? e.message : e);
}

// this fn is responsible for creating an s3 file and enqueueing
// an event to be processed by the segment worker
const prepareEvent = async (
  payload: Group | ITrack,
  tenantId: string,
  type: ISqsSegmentEvent["type"] = "track"
) => {
  const fileName = `${Date.now()}-${uuid.v4()}`;
  const filePath = `${tenantId}/${fileName}.json`;
  const message: ISqsSegmentEvent = {
    event: payload,
    path: filePath,
    type,
  };

  if (putEvent) {
    await putEvent(filePath, message);
  } else {
    logger.warn("Missing putEvent. Event not saved to S3:", message);
  }

  if (enqueueSegmentEvent) {
    await enqueueSegmentEvent(message);
  } else {
    logger.warn("Missing enqueueSegmentEvent. Event not queued", message);
  }
};

// group events allow users to be associated with a group / tenant
// as well as updating group / tenant properties
// more info: https://segment.com/docs/connections/spec/group/
export const sendGroupEvent = async (payload: Group) => {
  try {
    await prepareEvent(payload, payload.groupId.toString(), "group");
  } catch (e) {
    logger.error(e && e.message ? e.message : e);
  }
};

// track events are used to track specific actions users perform
// more info: https://segment.com/docs/connections/spec/track/
export const sendTrackEvent = async ({
  body = null,
  gaClientId = null,
  key,
  tenantId,
  userId,
}) => {
  try {
    const payload: ITrack = {
      body,
      gaClientId,
      key,
      tenantId,
      userId,
    };
    await prepareEvent(payload, tenantId);
  } catch (e) {
    logger.error(e && e.message ? e.message : e);
  }
};

export const trackUserScopedExperiment = async ({
  flagName,
  userId,
  tenantId,
}: {
  flagName: string;
  userId: string;
  tenantId: string;
}): Promise<boolean> => {
  const enabled = await getFeatureUserVariation(flagName, userId);
  const { logger } = new CourierLogger("Experiments");
  try {
    const payload: ITrack = {
      body: {
        experiment: flagName,
        variation: enabled ? "experiment" : "control",
      },
      key: "experiment",
      tenantId,
      userId,
    };
    await prepareEvent(payload, tenantId);
  } catch (e) {
    logger.warn(e && e.message ? e.message : e);
  }
  return enabled;
};
