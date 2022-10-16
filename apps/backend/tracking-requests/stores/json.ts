import s3 from "~/lib/s3";
import { ITrackingRequest } from "../types";
import getEnvVar from "~/lib/get-environment-variable";

export default {
  trackingRequest: s3<ITrackingRequest>(getEnvVar("TRACKING_REQUEST_STORE")),
  inboundSegmentEvents: s3<ITrackingRequest>(
    getEnvVar("INBOUND_SEGMENT_EVENTS_BUCKET")
  ),
};
