import { VM } from "vm2";
import { MessageChannels } from "~/api/send/types";
import { pipe } from "~/lib/pipe";
import { RoutingStrategy, RoutingSummary } from "~/lib/send-routing/types";
import {
  getChannelsByProvider,
  getChannelByProvider,
  getClassByProvider,
  getTaxonomyFromProvider,
} from "~/lib/taxonomy-helpers";
import { TokensByProvider } from "~/lib/token-storage";
import providers from "~/providers";
import { IProviderConfiguration } from "~/send/types";
import { INotificationWire } from "~/types.api";

/**
 * @deprecated
 * TODO: Remove once the july-2022-routing-tree-enabled has been enabled for everyone and run without issue
 */
export const generateRoutingSummary = async ({
  providerConfigs,
  params,
  strategy,
  notification,
  tokens,
}: {
  providerConfigs: IProviderConfiguration[];
  params: Record<"data" | "profile", any>;
  notification?: INotificationWire;
  strategy: RoutingStrategy;
  tokens?: TokensByProvider;
}): Promise<RoutingSummary[]> => {
  const filteredProviderConfigs = filterProviderConfigs({
    params,
    providerConfigs,
    strategy,
  });

  const summary = await walkRouting({
    params,
    providerConfigs: filteredProviderConfigs,
    strategy,
    tokens,
  });

  return pipe(summary)
    .into((summary) => applyNotificationToRoutingSummary(summary, notification))
    .complete();
};

export const walkRouting = async ({
  params,
  providerConfigs,
  strategy,
  tokens,
}: {
  params: Record<"data" | "profile", any>;
  providerConfigs: IProviderConfiguration[];
  strategy: RoutingStrategy;
  tokens?: TokensByProvider;
}): Promise<RoutingSummary[]> => {
  const {
    routing,
    channels: messageChannels,
    providers: messageProviders,
  } = strategy;

  const summary: RoutingSummary[] = [];
  for (const channel of routing.channels) {
    if (typeof channel === "string") {
      summary.push(
        ...(await generateSummaryFromChannel({
          channel,
          messageChannels,
          params,
          providerConfigs,
          tokens,
        }))
      );
    }

    if (typeof channel === "object") {
      summary.push(
        ...(await walkRouting({
          strategy: {
            routing: channel,
            channels: messageChannels,
            providers: messageProviders,
          },
          params,
          providerConfigs,
          tokens,
        }))
      );
    }

    if (summary.some((res) => res.selected) && routing.method === "single") {
      break;
    }
  }

  return summary;
};

export const generateSummaryFromChannel = async ({
  channel,
  messageChannels,
  params,
  providerConfigs,
  tokens,
}: {
  channel: string;
  messageChannels: MessageChannels;
  params: Record<"data" | "profile", any>;
  providerConfigs: IProviderConfiguration[];
  tokens?: TokensByProvider;
}): Promise<RoutingSummary[]> => {
  const messageChannel = messageChannels[channel];

  if (!evaluateStrategyConditional({ condition: messageChannel?.if, params })) {
    return [
      {
        channel,
        type: "FILTERED",
        selected: false,
        provider: "",
        reason: "Channel conditional failed",
      },
    ];
  }

  const providerCandidates = findConfiguredProvidersForChannel({
    channel,
    providerConfigs,
  }).filter(({ providerKey }) =>
    configuredProviderAllowedByChannel({
      providerKey,
      messageChannelProviders: messageChannel?.providers,
    })
  );

  if (providerCandidates.length === 0) {
    return [
      {
        channel,
        type: "NO_PROVIDERS",
        selected: false,
        reason:
          "No remaining configured providers for channel or channel is invalid", // Provider may have failed a conditional
        provider: "",
      },
    ];
  }

  return generateSummaryFromProviders({
    channel,
    params,
    providerConfigs: providerCandidates,
    routingMethod: messageChannel?.routing_method,
    tokens,
  });
};

export const generateSummaryFromProviders = async ({
  channel,
  params,
  providerConfigs,
  routingMethod = "single",
  tokens,
}: {
  channel: string;
  params: Record<"data" | "profile", any>;
  providerConfigs: ConfiguredProvider[];
  routingMethod?: "all" | "single";
  tokens?: TokensByProvider;
}): Promise<RoutingSummary[]> => {
  const summary: RoutingSummary[] = [];
  for (const provider of providerConfigs) {
    const { data, profile } = params;
    const canHandleResult = providers[provider.providerKey]?.handles({
      config: provider.config,
      data,
      profile,
      tokensByProvider: tokens,
    });

    const canHandle: boolean | Error =
      canHandleResult instanceof Promise
        ? await canHandleResult.catch((e) => e)
        : canHandleResult;

    if (canHandle instanceof Error) {
      summary.push({
        channel,
        provider: provider.providerKey,
        type: "PROVIDER_ERROR",
        reason:
          "Provider returned an error when checking its ability to handle the notification",
        selected: false,
      });
      continue;
    }

    if (!canHandle) {
      summary.push({
        channel,
        provider: provider.providerKey,
        type: "MISSING_PROVIDER_SUPPORT",
        reason: `Message is missing the minimum data required to send with this provider. Please check the message's profile and data properties and try again.`,
        selected: false,
      });
      continue;
    }

    summary.push(configuredProviderToSummary(channel, provider));
    if (routingMethod === "single") {
      break;
    }
  }
  return summary;
};

export const evaluateStrategyConditional = ({
  condition,
  params,
  type = "Channel",
}: {
  condition?: string;
  params: Record<"data" | "profile", any>;
  type?: "Channel" | "Provider";
}): boolean => {
  if (!condition) {
    return true;
  }

  const { data, profile } = params;

  const vm = new VM({ sandbox: { data, profile } });
  const result = vm.run(condition);

  if (typeof result !== "boolean") {
    throw new Error(
      `${type} conditional does not evaluate to boolean: ${condition}`
    );
  }

  return result;
};

export const configuredProviderToSummary = (
  channel: string,
  provider: ConfiguredProvider
): RoutingSummary => ({
  channel,
  provider: provider.providerKey,
  selected: true,
  configurationId: provider.config.id,
  taxonomy: provider.taxonomy,
});

export const findConfiguredProvidersForChannel = ({
  channel,
  providerConfigs,
}: {
  channel: string;
  providerConfigs: IProviderConfiguration[];
}): ConfiguredProvider[] =>
  providerConfigs
    .filter((config) => {
      const providerKey = config.json.provider;
      return (
        getChannelsByProvider(providerKey).includes(channel) ||
        getChannelByProvider(providerKey) === channel ||
        getClassByProvider(providerKey) === channel ||
        providerKey === channel
      );
    })
    .map((config) => ({
      config,
      providerKey: config.json.provider,
      taxonomy: getTaxonomyFromProvider(config.json.provider),
    }));

export const configuredProviderAllowedByChannel = ({
  providerKey,
  messageChannelProviders,
}: {
  providerKey: string;
  messageChannelProviders?: string[];
}): boolean => {
  if (!messageChannelProviders) {
    return true;
  }

  return messageChannelProviders.includes(providerKey);
};

type ConfiguredProvider = {
  providerKey: string;
  config: IProviderConfiguration;
  taxonomy: string;
};

export const filterProviderConfigs = ({
  params,
  providerConfigs,
  strategy,
}: {
  params: Record<"data" | "profile", any>;
  providerConfigs: IProviderConfiguration[];
  strategy: RoutingStrategy;
}): IProviderConfiguration[] =>
  providerConfigs.filter((config) => {
    const providerKey = config.json.provider;
    const messageProvider = strategy.providers[providerKey];
    return evaluateStrategyConditional({
      condition: messageProvider?.if,
      params,
      type: "Provider",
    });
  });

export const applyNotificationToRoutingSummary = (
  summary: RoutingSummary[],
  notification?: INotificationWire
): RoutingSummary[] => {
  if (!notification) {
    return summary;
  }

  const iChannels = [
    ...(notification.json?.channels?.always ?? []),
    ...(notification.json?.channels?.bestOf ?? []),
  ];

  return summary.map((result): RoutingSummary => {
    const iChannel = iChannels.find((channel) =>
      channel.taxonomy.includes(result.channel)
    );
    if (!iChannel) {
      return result;
    }

    return {
      ...result,
      id: iChannel.id,
    };
  });
};
