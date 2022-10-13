import {
  createArchivedEvent,
  createClickedEvent,
  createDeliveredEvent,
  createOpenedEvent,
  createReadEvent,
  createUnreadEvent,
  getByType as getEventsByType,
} from "~/lib/dynamo/event-logs";
import { BadRequest } from "~/lib/http-errors";
import { getTrackingRecord } from "~/lib/tracking-service";
import { ChannelDetails } from "~/types.internal";

const trackMap = {
  CLICKED: "CLICK_TRACKING",
  ARCHIVED: "ARCHIVE_TRACKING",
  DELIVERED: "DELIVER_TRACKING",
  OPENED: "OPEN_TRACKING",
  READ: "READ_TRACKING",
  UNREAD: "UNREAD_TRACKING",
};

export default async ({
  tenantId,
  env,
  trackingId,
  body,
}: {
  env?: string;
  tenantId: string;
  trackingId: string;
  body?: string;
}) => {
  const envTenantId = env === "test" ? `${tenantId}/test` : tenantId;
  let trackingRecord = await getTrackingRecord(envTenantId, trackingId);

  if (!trackingRecord) {
    return;
  }
  // Below condition adopts trackingRecord of type `CHANNEL_TRACKING` into structure similar to other tracking records
  // This is done to allow developers to use 1 tracking record to update multiple tracking events such as `CLICKED`, `DELIVERED`, `OPENED`, `READ`
  if (trackingRecord.type === "CHANNEL_TRACKING") {
    let trackingEventDetails;
    // following checks are only relevant if the type is `CHANNEL_TRACKING`
    // and we only know the type of tracking in this file.
    if (!body) {
      throw new BadRequest("Missing body");
    }
    trackingEventDetails = JSON.parse(body);

    if (!("event" in trackingEventDetails)) {
      throw new BadRequest("Missing event");
    }
    if (!(trackingEventDetails.event.toUpperCase() in trackMap)) {
      throw new BadRequest(`Invalid event: ${trackingEventDetails.event}`);
    }
    const trackingType = trackMap[trackingEventDetails.event.toUpperCase()];
    trackingRecord = { ...trackingRecord, type: trackingType };
  }

  const provider = trackingRecord.providerKey;
  const channel: ChannelDetails = {
    id: trackingRecord.channel?.id,
    taxonomy: trackingRecord.channel?.taxonomy,
  };
  switch (trackingRecord.type) {
    case "CLICK_TRACKING": {
      await createClickedEvent(
        envTenantId,
        trackingRecord.messageId,
        provider,
        channel,
        {
          forwardingUrl: trackingRecord.trackingHref,
        }
      );
      break;
    }

    case "UNREAD_TRACKING": {
      await createUnreadEvent(envTenantId, trackingRecord.messageId, {
        provider,
      });
      break;
    }

    case "READ_TRACKING": {
      await createReadEvent(envTenantId, trackingRecord.messageId, {
        provider,
      });
      break;
    }

    case "ARCHIVE_TRACKING": {
      await createArchivedEvent(envTenantId, trackingRecord.messageId, {
        provider,
      });
      break;
    }

    case "DELIVER_TRACKING": {
      const alreadyDelivered = await getEventsByType(
        envTenantId,
        trackingRecord.messageId,
        "provider:delivered"
      );

      if (alreadyDelivered?.length) {
        // don't mark delivered twice... we may of had 2 tabs open?
        return;
      }

      await createDeliveredEvent(
        envTenantId,
        trackingRecord.messageId,
        provider,
        trackingRecord.providerId,
        undefined,
        channel,
        new Date().getTime()
      );
      break;
    }

    case "OPEN_TRACKING": {
      await createOpenedEvent(
        envTenantId,
        trackingRecord.messageId,
        provider,
        channel,
        {
          ...trackingRecord,
        }
      );
      break;
    }
  }
};
