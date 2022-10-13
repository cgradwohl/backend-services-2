import { isPersonalizedWelcomeTemplate } from "~/lib/notifications/personalized-welcome";
import personalizedWelcomeNotificationJsonWire from "~/lib/notifications/prebuilt/personalized-welcome-email";
import quickstartNotificationJsonWire from "~/lib/notifications/prebuilt/welcome";
import { isQuickstartTemplate } from "~/lib/notifications/quickstart";
import { IVariableHandler } from "~/lib/variable-handler";
import { IProviderConfiguration } from "~/send/types";
import { getChannelProvider } from "./get-channel-provider";
import { IChannel } from "~/types.api";
import { channelHandles } from "~/workers/route/channel-handles";
import { TokensByProvider } from "~/lib/token-storage";
import { TemplateV1RouteNode } from "./types";
import { ChannelHandleFailedError } from "../errors";

export async function templateRouter(
  channels: IChannel[],
  templateId: string,
  providersById: Record<string, IProviderConfiguration>,
  variableHandler: IVariableHandler,
  tokens?: TokensByProvider,
  allowMultipleChannels?: boolean // Hack for failover
): Promise<TemplateV1RouteNode[]> {
  try {
    // WARNING: channelHandlesResult.channelsSummary can have multiple selected: true providers
    // Be sure to match the correct one against channelHandlesResult.channelProvider if doing "bestOf"
    // As of writing, this function is *always* bestOf
    const channelHandlesResult = await channelHandles(
      variableHandler,
      channels,
      providersById,
      tokens,
      allowMultipleChannels
    );

    // There is always going to be $single channel based on how we handle channel selection today.
    let channel = channelHandlesResult?.channel;

    if (!channel && isQuickstartTemplate(templateId)) {
      [channel] = quickstartNotificationJsonWire.json.channels.bestOf;
    }

    if (!channel && isPersonalizedWelcomeTemplate(templateId)) {
      [channel] = personalizedWelcomeNotificationJsonWire.json.channels.bestOf;
    }

    const channelProvider = getChannelProvider(
      templateId,
      channelHandlesResult
    );

    return channelHandlesResult.channelsSummary.map<TemplateV1RouteNode>(
      (channelSummary) => {
        if (
          channelSummary.selected &&
          channelProvider?.key === channelSummary.provider
        ) {
          return { ...channelSummary, ...channelProvider, ...channel };
        }

        // Here channelSummary.selected really means the provider *can* handle the route, NOT should.
        if (channelSummary.selected) {
          return {
            ...channelSummary,
            selected: false,
            reason: "Better match found",
            canUseForFailover: true,
          };
        }

        return { ...channelSummary };
      }
    );
  } catch (e) {
    throw new ChannelHandleFailedError();
  }
}
