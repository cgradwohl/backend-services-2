import {
  CourierObject,
  IChannel,
  IConfigurationJson,
  INotificationWire,
} from "~/types.api";
import { ITrackingRecord } from "~/types.internal";
import { saveTrackingRecords } from ".";
import { generateEventTrackingLink } from "../generate-tracking-links";
import { ILinkData } from "../link-handler";
import { getTrackingDomain } from "../tracking-domains";
import { generateTrackingId } from "./generate-tracking-id";
export interface ISaveClickThroughTrackingRecordsParams {
  channel?: Partial<IChannel>;
  message: {
    messageId: string;
    tenantId: string;
  };
  notification?: INotificationWire;
  providerConfig: CourierObject<IConfigurationJson>;
  recipientId: string;
  clickThroughTrackingEnabled: boolean;
  links: { [context: string]: ILinkData };
  variableData;
  emailOpenTrackingEnabled: boolean;
  openTrackingId: string;
  unsubscribeTrackingId: string;
}
export async function saveClickThroughTrackingRecords({
  channel,
  message,
  notification,
  providerConfig,
  recipientId,
  clickThroughTrackingEnabled,
  links,
  variableData,
  emailOpenTrackingEnabled,
  openTrackingId,
  unsubscribeTrackingId,
}: ISaveClickThroughTrackingRecordsParams) {
  const cttRecords: ITrackingRecord[] = [];
  const cttRecord: Omit<
    ITrackingRecord,
    "trackingHref" | "trackingId" | "type"
  > = {
    channel,
    channelId: channel?.id,
    messageId: message.messageId,
    notificationId: notification?.id,
    providerId: providerConfig.id,
    providerKey: providerConfig.json.provider,
    recipientId,
    tenantId: message.tenantId,
  };
  const trackingDomain = await getTrackingDomain(message.tenantId);

  if (clickThroughTrackingEnabled) {
    // get links
    const trackedLinks = Object.values(links);

    trackedLinks.forEach((link) => {
      // strip null strings
      const linkData = Object.keys(link.options).reduce(
        (acc, key) => {
          const value = link.options[key];

          if (value !== "") {
            acc[key] = value;
          }

          return acc;
        },
        { context: link.context }
      );

      cttRecords.push({
        ...cttRecord,
        data: linkData,
        trackingHref: link.trackingHref,
        trackingId: link.trackingId,
        type: "CLICK_TRACKING",
      });
    });
  }

  // add opened tracking record?
  if (channel.taxonomy.includes("email") && emailOpenTrackingEnabled) {
    cttRecords.push({
      ...cttRecord,
      trackingHref: variableData.urls.opened,
      trackingId: openTrackingId,
      type: "OPEN_TRACKING",
    });
  }

  // add unsubscribe record
  if (notification) {
    cttRecords.push({
      ...cttRecord,
      trackingHref: variableData.urls.unsubscribe,
      trackingId: unsubscribeTrackingId,
      type: "UNSUBSCRIBE_TRACKING",
    });
  }

  let trackingUrls;
  let trackingIds;

  const isPush = channel.taxonomy.includes("push");
  const isBanner = channel.taxonomy.includes("banner");
  const isInbox = channel.taxonomy.includes("inbox");

  if (isInbox || isBanner || isPush) {
    const archiveTrackingId = generateTrackingId();
    const archiveTrackingUrl = generateEventTrackingLink(
      message.tenantId,
      archiveTrackingId,
      trackingDomain
    );

    cttRecords.push({
      ...cttRecord,
      trackingHref: archiveTrackingUrl,
      trackingId: archiveTrackingId,
      type: "ARCHIVE_TRACKING",
    });

    trackingUrls = {
      ...trackingUrls,
      archiveTrackingUrl,
    };

    trackingIds = {
      ...trackingIds,
      archiveTrackingId,
    };
  }

  if (isPush || isInbox) {
    const deliverTrackingId = generateTrackingId();
    const deliverTrackingUrl = generateEventTrackingLink(
      message.tenantId,
      deliverTrackingId,
      trackingDomain
    );

    cttRecords.push({
      ...cttRecord,
      trackingHref: deliverTrackingUrl,
      trackingId: deliverTrackingId,
      type: "DELIVER_TRACKING",
    });

    const clickTrackingId = generateTrackingId();
    const clickTrackingUrl = generateEventTrackingLink(
      message.tenantId,
      clickTrackingId,
      trackingDomain
    );

    cttRecords.push({
      ...cttRecord,
      trackingHref: clickTrackingUrl,
      trackingId: clickTrackingId,
      type: "CLICK_TRACKING",
    });

    const readTrackingId = generateTrackingId();
    const readTrackingUrl = generateEventTrackingLink(
      message.tenantId,
      readTrackingId,
      trackingDomain
    );

    cttRecords.push({
      ...cttRecord,
      trackingHref: readTrackingUrl,
      trackingId: readTrackingId,
      type: "READ_TRACKING",
    });

    const unreadTrackingId = generateTrackingId();
    const unreadTrackingUrl = generateEventTrackingLink(
      message.tenantId,
      unreadTrackingId,
      trackingDomain
    );

    cttRecords.push({
      ...cttRecord,
      trackingHref: unreadTrackingUrl,
      trackingId: unreadTrackingId,
      type: "UNREAD_TRACKING",
    });

    const channelTrackingId = generateTrackingId();
    const channelTrackingUrl = generateEventTrackingLink(
      message.tenantId,
      channelTrackingId,
      trackingDomain
    );

    cttRecords.push({
      ...cttRecord,
      trackingHref: channelTrackingUrl,
      trackingId: channelTrackingId,
      type: "CHANNEL_TRACKING",
    });

    trackingUrls = {
      ...trackingUrls,
      channelTrackingUrl,
      clickTrackingUrl,
      deliverTrackingUrl,
      readTrackingUrl,
      unreadTrackingUrl,
    };

    trackingIds = {
      ...trackingIds,
      channelTrackingId,
      clickTrackingId,
      deliverTrackingId,
      readTrackingId,
      unreadTrackingId,
    };
  }

  if (cttRecords.length) {
    await saveTrackingRecords(cttRecords);
  }

  return {
    trackingIds,
    trackingUrls,
  };
}
