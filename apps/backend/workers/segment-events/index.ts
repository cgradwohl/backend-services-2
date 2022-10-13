import { SQSEvent } from "aws-lambda";

import captureException from "~/lib/capture-exception";
import logger from "~/lib/logger";
import jsonStore from "~/lib/s3";
import { ISqsSegmentEvent } from "~/lib/segment/types";
import { group } from "./group";
import { track } from "./track";
import { Group, ITrack } from "./types";

const s3SegmentEventsBucket = process.env.S3_SEGMENT_EVENTS_BUCKET;

const handle = async (ev: SQSEvent) => {
  await Promise.all(
    ev.Records.map(async (r) => {
      try {
        const message = (
          typeof r.body === "string" ? JSON.parse(r.body) : r.body
        ) as ISqsSegmentEvent;
        const { get: getSegmentEvent } = jsonStore<ISqsSegmentEvent>(
          s3SegmentEventsBucket
        );

        // get message from s3
        const { type, event } = await getSegmentEvent(message.path);

        // handle segment event
        switch (type) {
          case "track":
            await track(event as ITrack);
            break;
          case "group":
            await group(event as Group);
            break;
          default:
            logger.error(`Unsupported event type: ${type}`);
        }
      } catch (err) {
        logger.debug(ev);
        logger.error(err);
        await captureException(err);
        throw err;
      }
    })
  );
};

export { handle };
