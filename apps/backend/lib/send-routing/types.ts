import {
  ChannelTimeout,
  MessageChannels,
  MessageProviders,
  MessageRouting,
} from "~/api/send/types";

/** TenantId 3 digit hex hash (0-fff) / TenantId _ Strategy Name */
export type MessageRoutingStrategyFilePath =
  `${string}/${string}_${string}_routing_strategy.json`;

export interface RoutingStrategy {
  routing: MessageRouting;
  channels: MessageChannels;
  providers: MessageProviders;
}

/**
 * A routing summary shown to user. Designed to be compatible with legacy IRoutingSummary and
 * the legacy rendering pipeline.
 */
export interface RoutingSummary {
  channel: string;
  configurationId?: string;
  provider?: string;
  type?:
    | "FILTERED"
    | "NO_CHANNELS"
    | "NO_PROVIDERS"
    | "OPT_IN_REQUIRED"
    | "PROVIDER_ERROR"
    | "UNPUBLISHED"
    | "UNSUBSCRIBED"
    | "MISSING_PROVIDER_SUPPORT";
  reason?: string;
  selected: boolean;
  taxonomy?: string;

  /** Template notification configured channelId */
  id?: string;
}

export type RouteNode =
  | RouteBranch
  | RouteLeaf
  | DeadRouteLeaf
  | DeadRouteBranch;

export interface RouteBranch extends RouteNodeProtocol {
  type: "branch";
  nodes: RouteNode[];

  /** A node to fallback to in the event that sending to every child of this node fails */
  failover?: RouteNode;
}

/** A Route that can be sent. Equivalent to RoutingSummary.selected = true */
export interface RouteLeaf extends RouteNodeProtocol {
  type: "leaf";
  channel: string;
  provider: string;
  taxonomy: string;
  providerConfigurationId: string;

  /**
   * Refers to configuration data associated with this channel+provider. This is data is configured
   * inside of a notification template designed using the Studio UI as of July 2022. *MUST* be
   * mapped to id in RoutingSummary or IRoutingSummary for the legacy render pipeline to work properly.
   */
  templateChannelId?: string;

  /**
   * Index starts at 1.
   * Used to determine provider timeout. For example. A message set's provider timeouts to 5000ms.
   * Provider 1 would timeout at RoutingIR.startDate + (1 * 5000). Failover provider 2 would timeout
   * at RoutingIR.startDate + (2 * 5000). Etc. Should be set to 0 when we failover to a different
   * channel.
   */
  providerFailoverIndex: number;
}

/**
 * A route that could not be used for some reason. We include it in the tree for helpful
 * debugging information that a customer can use.
 */
export interface DeadRouteLeaf extends RouteNodeProtocol {
  type: "dead-leaf";
  channel: string;
  provider: string;
  failureType: RoutingSummary["type"];
  failureReason: string;
}

/**
 * A route branch that could not be used for some reason. We include it in the tree for helpful
 * debugging information that a customer can use.
 */
export interface DeadRouteBranch extends RouteNodeProtocol {
  type: "dead-branch";
  channel: string;
  failureType: RoutingSummary["type"];
  failureReason: string;
}

export interface RouteNodeProtocol {
  type: "branch" | "leaf" | "dead-leaf" | "dead-branch";

  address: RouteNodeAddress;
}

/** [tree-level-1-index, tree-level-2-index, etc] */
export type RouteNodeAddress = (number | "failover")[];

/** ISO 8601 date that send attempts occurred */
export interface SendTimes {
  message: string;
  channels: {
    [channel: string]: string;
  };
}

/**
 * Time in ms a send can take on a provider, channel, and message level.
 * See isRouteLeafTimedOut for intended usage and timeout precedence.
 *
 * Note: Non Custom tier customers only have message level overrides, other fields will be left undefined
 */
export interface RouteTimeoutTable {
  message: number;
  channel?: number;
  channels?: {
    [channel: string]: ChannelTimeout<number>;
  };
  provider?: number;
  providers?: { [provider: string]: number };
}
