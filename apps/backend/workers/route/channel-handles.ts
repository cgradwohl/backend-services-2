import shouldFilter from "~/lib/conditional-filter";
import getChannelLabel from "~/lib/get-channel-label";
import getChannelName from "~/lib/get-channel-name";
import { providerHandles } from "./provider-handles";
import { IVariableHandler } from "~/lib/variable-handler";
import {
  CourierObject,
  IChannel,
  IConditionalConfig,
  IConfigurationJson,
} from "~/types.api";
import { TokensByProvider } from "~/lib/token-storage";

type ChannelHandleResultType = {
  reason?: string;
  selected: boolean;
  channel: string;
  channelLabel: string;
  provider?: string;
  conditional?: IConditionalConfig;
  id?: string;
  taxonomy?: string;
}[];

export const channelHandles = async (
  variableHandler: IVariableHandler,
  channels: IChannel[],
  configurationMap: {
    [configId: string]: CourierObject<IConfigurationJson>;
  },
  tokens?: TokensByProvider,
  allowMultipleChannels?: boolean // Hack for failover
) => {
  let channel: IChannel;
  let channelProvider;
  const channelHandleResults: ChannelHandleResultType = [];

  for (const c of channels) {
    if (c.disabled) {
      channelHandleResults.push({
        channel: getChannelName(c),
        channelLabel: getChannelLabel(c),
        reason: "CHANNEL_DISABLED",
        selected: false,
      });

      continue;
    }

    if (shouldFilter(variableHandler, c.conditional)) {
      channelHandleResults.push({
        channel: getChannelName(c),
        channelLabel: getChannelLabel(c),
        conditional: c.conditional,
        reason: "FILTERED_OUT_AT_CHANNEL",
        selected: false,
      });

      continue;
    }

    for (const provider of c.providers) {
      const channelLabel = getChannelLabel(c);
      const channelName = getChannelName(c);
      if (!provider.configurationId) {
        channelHandleResults.push({
          channel: channelName,
          channelLabel,
          conditional: provider.conditional,
          reason: "MISSING_CONFIGURATION_ID",
          selected: false,
        });
        continue;
      }

      const config = configurationMap[provider.configurationId];
      const providerHandled = await providerHandles(
        channelName,
        channelLabel,
        variableHandler,
        config,
        provider,
        tokens
      );

      if (channel && allowMultipleChannels) {
        channelHandleResults.push({ ...providerHandled, ...provider, ...c });
      } else {
        channelHandleResults.push(providerHandled);
      }

      if (providerHandled.selected && !channel && !channelProvider) {
        channelProvider = provider;
        channel = c;
      }
    }

    if (channel && !allowMultipleChannels) {
      break;
    }
  }

  return {
    channel,
    channelProvider,
    channelsSummary: channelHandleResults,
  };
};
