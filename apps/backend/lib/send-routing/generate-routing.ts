import { VM } from "vm2";
import { MessageChannels } from "~/api/send/types";
import {
  RoutingStrategy,
  RouteNode,
  RouteBranch,
  RouteLeaf,
  DeadRouteLeaf,
  DeadRouteBranch,
  RouteNodeAddress,
} from "~/lib/send-routing/types";
import {
  getChannelsByProvider,
  getChannelByProvider,
  getClassByProvider,
  getTaxonomyFromProvider,
} from "~/lib/taxonomy-helpers";
import { TokensByProvider } from "~/lib/token-storage";
import { IProviderConfiguration } from "~/send/types";
import { INotificationWire } from "~/types.api";
import { clone } from "~/lib/utils";
import { callProviderHandles } from "./lib/call-provider-handles";

export interface RoutingGeneratorOpts {
  providerConfigs: IProviderConfiguration[];
  params: Record<"data" | "profile", any>;
  templateV1?: INotificationWire;
  strategy: RoutingStrategy;
  tokens?: TokensByProvider;
}

export const generateRouting = async (
  opts: RoutingGeneratorOpts
): Promise<RouteNode> => walkRouting(opts);

interface WalkRoutingOpts extends RoutingGeneratorOpts {
  address?: RouteNodeAddress;
}

const walkRouting = async (opts: WalkRoutingOpts): Promise<RouteNode> => {
  const {
    routing,
    channels: messageChannels,
    providers: messageProviders,
  } = opts.strategy;
  const address = opts.address ?? [];

  const branch: RouteNode = makeRouteBranch({ address, nodes: [] });
  for (const [index, channel] of routing.channels.entries()) {
    if (typeof channel === "string") {
      branch.nodes.push(
        await generateNodeForChannel({
          ...opts,
          address: getNextChildAddress(address, branch.nodes),
          channel,
          messageChannels,
        })
      );
    }

    if (typeof channel === "object") {
      branch.nodes.push(
        await walkRouting({
          ...opts,
          address: getNextChildAddress(address, branch.nodes),
          strategy: {
            routing: channel,
            channels: messageChannels,
            providers: messageProviders,
          },
        })
      );
    }

    const hasSelected = routeNodeHasSelectedProvider(branch);
    const completedSingle = hasSelected && routing.method === "single";

    if (completedSingle) {
      const nextOpts = clone(opts);
      const remainingChannels = routing.channels.slice(index + 1);
      nextOpts.strategy.routing.channels = remainingChannels;
      nextOpts.address = getNextChildAddress(address, "failover");
      branch.failover =
        remainingChannels.length > 0 ? await walkRouting(nextOpts) : undefined;
      break;
    }
  }

  return branch;
};

interface GenerateNodeForChannelOpts extends RoutingGeneratorOpts {
  channel: string;
  messageChannels: MessageChannels;
  address: RouteNodeAddress;
}

const generateNodeForChannel = async (
  opts: GenerateNodeForChannelOpts
): Promise<RouteNode> => {
  const { channel, messageChannels, params, providerConfigs, address } = opts;
  const messageChannel = messageChannels[channel];

  if (!evaluateStrategyConditional({ condition: messageChannel?.if, params })) {
    return makeDeadRouteBranch({
      channel,
      failureType: "FILTERED",
      failureReason: "Channel conditional failed",
      address,
    });
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
    return makeDeadRouteBranch({
      channel,
      failureType: "NO_PROVIDERS",
      failureReason:
        "No remaining configured providers for channel or channel is invalid",
      address,
    });
  }

  return generateBranchNodeForChannel({
    ...opts,
    providerCandidates: providerCandidates,
    routingMethod: messageChannel?.routing_method,
  });
};

interface GenerateBranchNodeForChannelOpts extends RoutingGeneratorOpts {
  address: RouteNodeAddress;
  routingMethod?: "all" | "single";
  channel: string;
  providerCandidates: ProviderCandidate[];
  providerFailoverIndex?: number;
}

const generateBranchNodeForChannel = async (
  opts: GenerateBranchNodeForChannelOpts
): Promise<RouteNode> => {
  const {
    channel,
    params,
    providerCandidates,
    routingMethod = "single",
    tokens,
    address,
    providerFailoverIndex = 1,
    strategy,
  } = opts;

  const branch = makeRouteBranch({ address, nodes: [] });
  for (const [index, provider] of providerCandidates.entries()) {
    const deadLeaf = await testProvider({
      address: getNextChildAddress(address, branch.nodes),
      channel,
      provider,
      params,
      tokens,
      strategy,
    });

    if (deadLeaf) {
      branch.nodes.push(deadLeaf);
      continue;
    }

    const leaf = makeRouteLeaf({
      channel,
      provider: provider.providerKey,
      providerConfigurationId: provider.config.id,
      taxonomy: provider.taxonomy,
      address: getNextChildAddress(address, branch.nodes),
      providerFailoverIndex,
    });

    branch.nodes.push(
      opts.templateV1 ? applyTemplateChannelId(leaf, opts.templateV1) : leaf
    );

    if (routingMethod === "single") {
      const nextProviderCandidates = providerCandidates.slice(index + 1);
      branch.failover =
        nextProviderCandidates.length > 0
          ? await generateBranchNodeForChannel({
              ...clone(opts),
              address: getNextChildAddress(address, "failover"),
              providerCandidates: nextProviderCandidates,
              providerFailoverIndex: providerFailoverIndex + 1,
            })
          : undefined;
      break;
    }
  }

  return branch;
};

const evaluateStrategyConditional = ({
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

const findConfiguredProvidersForChannel = ({
  channel,
  providerConfigs,
}: {
  channel: string;
  providerConfigs: IProviderConfiguration[];
}): ProviderCandidate[] =>
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

const configuredProviderAllowedByChannel = ({
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

interface TestProviderOpts {
  address: RouteNodeAddress;
  channel: string;
  provider: ProviderCandidate;
  params: Record<"data" | "profile", any>;
  strategy: RoutingStrategy;
  tokens?: TokensByProvider;
}

/**
 * Check provider conditional and handles to see if the provider can be used for the send.
 * If this function returns a DeadRouteLeaf, the provider failed the test.
 */
const testProvider = async (
  opts: TestProviderOpts
): Promise<DeadRouteLeaf | undefined> => {
  const failedConditional = checkProviderConditional({
    address: opts.address,
    channel: opts.channel,
    providerKey: opts.provider.providerKey,
    params: opts.params,
    strategy: opts.strategy,
  });

  if (failedConditional) return failedConditional;

  return checkProviderHandles(opts);
};

/** If this function returns a dead-leaf, the provider failed it's handles function */
const checkProviderHandles = async (
  opts: TestProviderOpts
): Promise<DeadRouteLeaf | undefined> => {
  const { provider, params, tokens, channel, address } = opts;
  const { data, profile } = params;
  const canHandleResult = callProviderHandles({
    providerConfig: provider.config,
    providerKey: provider.providerKey,
    data,
    profile,
    tokensByProvider: tokens,
  });

  const canHandle: boolean | Error =
    canHandleResult instanceof Promise
      ? await canHandleResult.catch((e) => e)
      : canHandleResult;

  if (canHandle instanceof Error) {
    return makeDeadRouteLeaf({
      channel,
      provider: provider.providerKey,
      failureType: "PROVIDER_ERROR",
      failureReason:
        "Provider returned an error when checking its ability to handle the notification",
      address,
    });
  }

  if (!canHandle) {
    return makeDeadRouteLeaf({
      channel,
      provider: provider.providerKey,
      failureType: "MISSING_PROVIDER_SUPPORT",
      failureReason: "Information required by the provider was not included.",
      address,
    });
  }
};

const checkProviderConditional = (opts: {
  address: RouteNodeAddress;
  channel: string;
  params: Record<"data" | "profile", any>;
  providerKey: string;
  strategy: RoutingStrategy;
}): DeadRouteLeaf | undefined => {
  const { address, channel, params, providerKey, strategy } = opts;
  const result = evaluateStrategyConditional({
    condition: strategy.providers?.[providerKey]?.if,
    params,
    type: "Provider",
  });

  if (!result) {
    return makeDeadRouteLeaf({
      channel,
      provider: providerKey,
      failureType: "FILTERED",
      failureReason: `Provider conditional failed (message.providers.${providerKey}.if)`,
      address,
    });
  }
};

export const applyTemplateChannelId = (
  route: RouteLeaf,
  templateV1?: INotificationWire
): RouteLeaf => {
  if (!templateV1) {
    return route;
  }

  const iChannels = [
    ...(templateV1.json?.channels?.always ?? []),
    ...(templateV1.json?.channels?.bestOf ?? []),
  ];

  const iChannel = iChannels.find((channel) =>
    channel.taxonomy.includes(route.channel)
  );

  if (!iChannel) {
    return route;
  }

  return {
    ...route,
    templateChannelId: iChannel.id,
  };
};

export const routeNodeHasSelectedProvider = (node: RouteNode): boolean => {
  if (node.type === "branch") {
    return node.nodes.some(routeNodeHasSelectedProvider);
  }

  /** Leafs are considered to be selected */
  return node.type === "leaf";
};

export const getNextChildAddress = (
  parentAddress: RouteNodeAddress,
  parentChildren: RouteNode[] | "failover"
): RouteNodeAddress => [
  ...parentAddress,
  parentChildren instanceof Array ? parentChildren.length : "failover",
];

export const makeRouteBranch = (
  opts: Omit<RouteBranch, "type">
): RouteBranch => ({
  ...opts,
  type: "branch",
});

export const makeRouteLeaf = (opts: Omit<RouteLeaf, "type">): RouteLeaf => ({
  ...opts,
  type: "leaf",
});

export const makeDeadRouteLeaf = (
  opts: Omit<DeadRouteLeaf, "type">
): DeadRouteLeaf => ({
  ...opts,
  type: "dead-leaf",
});

export const makeDeadRouteBranch = (
  opts: Omit<DeadRouteBranch, "type">
): DeadRouteBranch => ({
  ...opts,
  type: "dead-branch",
});

type ProviderCandidate = {
  providerKey: string;
  config: IProviderConfiguration;
  taxonomy: string;
};
