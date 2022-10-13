import Analytics from "analytics-node";
import makeError from "make-error";
import { promisify } from "util";
import getTenantInfo from "~/lib/get-tenant-info";
import { error } from "~/lib/log";
import eventHandlers, { transformEventKey } from "~/lib/segment/events/track";
import { IAnalyticsEventResponse } from "~/lib/segment/types";
import { ITrack } from "./types";

const UnsupportedEvent = makeError("UnsupportedSegmentEvent");

let asyncTrack;
let client: Analytics;
const segmentWriteKey = process.env.SEGMENT_WRITE_KEY;

try {
  client = new Analytics(segmentWriteKey);
  asyncTrack = promisify(client.track.bind(client));
} catch (e) {
  error(e && e.message ? e.message : e);
}

export const track = async (data: ITrack) => {
  try {
    const { body = null, gaClientId, key, tenantId, userId } = data;

    // keys that include a single prefixed underscore (e.g. uxt_)
    // will not attempt to validate the event against a hard-coded
    // segment track event. old keys would look like `account-created`.
    const splitKey = key.split("_");

    let json: IAnalyticsEventResponse;
    if (splitKey.length === 1) {
      // deprecated approach to segment track events
      // get specific track event handler
      const handler = eventHandlers.get(key);
      if (!handler) {
        throw new UnsupportedEvent(`Unsupported event: ${key}`);
      }

      // all usage data should be reported without env-scoping
      const { tenantId: rootTenantId } = getTenantInfo(tenantId);

      // generate event-specific payload with handler
      json = handler({
        body,
        gaClientId,
        key,
        tenantId: rootTenantId,
        userId,
      });
    } else {
      /*
        new approach to pass-through segment track events, first leveraged
        by ux tracking events / product tours.

        key ex. for clarity:
          key = 'uxt_tour-started' (comes from frontend this way)
          splitKey = ['uxt', 'tour-started']
          transformedKey = 'UXT Tour Started'
      */
      const transformedKey = `${splitKey[0].toUpperCase()} ${transformEventKey(
        splitKey[1]
      )}`;

      json = {
        context: {
          groupId: tenantId,
        },
        event: transformedKey,
        properties: body,
        type: "track",
        userId,
      };
    }

    if (gaClientId) {
      json.integrations = {
        "Google Analytics": {
          clientId: gaClientId,
        },
      };
    }

    // send track event to segment
    if (asyncTrack) {
      await asyncTrack(json);
    }
  } catch (e) {
    error(e?.message ?? e);
  }
};
