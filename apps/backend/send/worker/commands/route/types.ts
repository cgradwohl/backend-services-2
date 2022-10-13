import { MessageStatusReason } from "~/lib/message-service/types";
import {
  IChannelConfiguration,
  IChannelProvider,
  IChannelProviderConfiguration,
  IConditionalConfig,
} from "~/types.api";

export interface IChannelSummary {
  channel: string;
  reason: string;
  selected: boolean;
}

export interface IUndeliverableEventLog {
  type: MessageStatusReason;
  reason: string;
  data: Record<string, unknown>;
}

export interface IRoutingSummary {
  channel: string;
  provider?: string;
  selected: boolean;
  timedout?: boolean;
  blockIds?: string[] | null;
  config?: IChannelConfiguration | IChannelProviderConfiguration | undefined;
  id?: string;
  reason?: string;
  providers?: IChannelProvider[] | null;
  taxonomy?: string;
  disabled?: boolean;
  label?: string;
  conditional?: IConditionalConfig;
  key?: string;
  // Provider Configuration ID
  configurationId?: string;
}
