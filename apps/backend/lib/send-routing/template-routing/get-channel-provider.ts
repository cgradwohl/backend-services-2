import {
  isPersonalizedWelcomeTemplate,
  personalizedWelcomeChannelProvider,
} from "~/lib/notifications/personalized-welcome";
import {
  isQuickstartTemplate,
  quickstartChannelProvider,
} from "~/lib/notifications/quickstart";
import { IChannel, IChannelProvider } from "~/types.api";

export function getChannelProvider(
  templateId: string,
  channelHandlesResult: {
    channel?: IChannel;
    channelProvider?: IChannelProvider;
    channelsSummary: any[];
  }
) {
  const isNotificationUsingQuickstart = isQuickstartTemplate(templateId);
  const isPersonalizedWelcomeNotification =
    isPersonalizedWelcomeTemplate(templateId);

  if (isNotificationUsingQuickstart) {
    return quickstartChannelProvider;
  }

  if (isPersonalizedWelcomeNotification) {
    return personalizedWelcomeChannelProvider;
  }

  return channelHandlesResult?.channelProvider;
}
