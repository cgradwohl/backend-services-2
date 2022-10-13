import shouldFilter from "~/lib/conditional-filter";
import providers from "~/providers";

import {
  CourierObject,
  IChannelProvider,
  IConfigurationJson,
} from "~/types.api";

import { IVariableHandler } from "~/lib/variable-handler";
import { TokensByProvider } from "~/lib/token-storage";

export const providerHandles = async (
  channelName: string,
  channelLabel: string,
  variableHandler: IVariableHandler,
  config: CourierObject<IConfigurationJson>,
  provider: Partial<IChannelProvider>,
  tokens?: TokensByProvider
) => {
  const labels = {
    channel: channelName,
    channelLabel,
    provider: provider.key,
  };
  if (shouldFilter(variableHandler, provider.conditional)) {
    return {
      ...labels,
      conditional: provider.conditional,
      reason: "FILTERED_AT_PROVIDER",
      selected: false,
    };
  }

  if (!config) {
    return {
      ...labels,
      reason: "MISSING_CONFIGURATION",
      selected: false,
    };
  }

  const p = providers[config.json.provider];
  if (!p) {
    return {
      ...labels,
      reason: `MISSING_PROVIDER_SUPPORT`,
      selected: false,
    };
  }

  const { profile, data } = variableHandler.getRootValue();
  const canHandle = await p.handles({
    config,
    profile,
    data,
    providerConfig: provider.config,
    tokensByProvider: tokens,
  });

  if (typeof canHandle === "string") {
    return {
      ...labels,
      reason: canHandle,
      selected: false,
    };
  }

  return {
    ...labels,
    reason: !canHandle ? `INCOMPLETE_PROFILE_DATA` : undefined,
    selected: canHandle,
  };
};
