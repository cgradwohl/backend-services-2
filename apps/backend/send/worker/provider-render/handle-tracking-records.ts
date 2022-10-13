import {
  ISaveClickThroughTrackingRecordsParams,
  saveClickThroughTrackingRecords,
} from "~/lib/tracking-service/save-click-through-tracking";
import { IProviderConfiguration, ISendMessageContext } from "~/send/types";
import { ILinkData } from "~/lib/link-handler";
import { IChannel } from "~/types.api";
import isNotificationWire from "~/send/utils/is-notification-wire";

export const handleTrackingRecords = async (
  context: ISendMessageContext,
  {
    trackingRecords,
    channelRendered,
    providerConfig,
    messageId,
    taxonomy,
  }: {
    messageId: string;
    channelRendered?: IChannel;
    providerConfig: IProviderConfiguration;
    taxonomy: string;
    trackingRecords: {
      links: {
        [context: string]: ILinkData;
      };
      openTrackingId?: string;
      unsubscribeTrackingId?: string;
    };
  }
) => {
  const clickThroughTrackingEnabled =
    context.tenant?.clickThroughTracking?.enabled ?? false;
  const emailOpenTrackingEnabled =
    context.tenant?.emailOpenTracking?.enabled ?? true;

  const clickTrackingRecords: ISaveClickThroughTrackingRecordsParams = {
    channel: channelRendered ?? { id: "inline", taxonomy },
    clickThroughTrackingEnabled:
      clickThroughTrackingEnabled && context?.dryRunKey !== "mock",
    emailOpenTrackingEnabled:
      emailOpenTrackingEnabled && context?.dryRunKey !== "mock",
    links: trackingRecords.links,
    message: {
      messageId,
      tenantId: context.tenant.tenantId,
    },
    notification: isNotificationWire(context.content)
      ? context.content
      : undefined,
    openTrackingId: trackingRecords.openTrackingId,
    unsubscribeTrackingId: trackingRecords.unsubscribeTrackingId,
    providerConfig,
    recipientId: context.profile?.user_id,
    variableData: context?.variableData,
  };

  const savedTrackingRecords = await saveClickThroughTrackingRecords(
    clickTrackingRecords
  );

  return savedTrackingRecords;
};
