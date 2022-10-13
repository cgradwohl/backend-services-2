import {
  IBrandColors,
  IBrandSettingsEmail,
  IBrandSettingsInApp,
  IBrandSnippets,
} from "~/lib/brands/types";
import { IBrand } from "~/types.api";
import { IProfilePreferences } from "~/types.public";
import { ElementalContent } from "./courier-elemental";

export * from "./courier-elemental";

export interface MessageData extends Record<string, any> {}

type InvalidListRecipient = {
  user_id: string;
  list_pattern: string;
};

type ListRecipientType = Record<string, unknown> & {
  [key in keyof InvalidListRecipient]?: never;
};
export interface ListRecipient extends ListRecipientType {
  list_id?: string;
  data?: MessageData;
}

export interface AudienceRecipient {
  audience_id: string;
  data?: MessageData;
}

type InvalidListPatternRecipient = {
  user_id: string;
  list_id: string;
};

type ListPatternRecipientType = Record<string, unknown> & {
  [key in keyof InvalidListPatternRecipient]?: never;
};
export interface ListPatternRecipient extends ListPatternRecipientType {
  list_pattern?: string;
  data?: MessageData;
}

type InvalidUserRecipient = {
  list_id: string;
  list_pattern: string;
};

type UserRecipientType = Record<string, unknown> & {
  [key in keyof InvalidUserRecipient]?: never;
};

export interface UserRecipient extends UserRecipientType {
  data?: MessageData;
  email?: string;
  locale?: string;
  user_id?: string;
  phone_number?: string;
  preferences?: IProfilePreferences;
}

export type Recipient =
  | AudienceRecipient
  | ListRecipient
  | ListPatternRecipient
  | UserRecipient;

export type MessageRecipient = Recipient | Recipient[];

export interface ElementalContentSugar {
  body?: string;
  title?: string;
}

export interface Timeout {
  /** I recommend deprecating the record format, makes overrides a bit confusing */
  provider?: number | { [provider: string]: number };
  /** I recommend deprecating the record format, makes overrides a bit confusing */
  channel?: number | { [provider: string]: number };
  message?: number;
}

/** @deprecated */
export interface TimeoutDate<T> {
  message: T;
  channel?: T;
  channels?: {
    [channel: string]: ChannelTimeout<T>;
  };
  provider?: T;
  providers?: { [provider: string]: T };
}

/** @deprecated Timeout specified as an epoch date (seconds after unix epoch) */
export interface TimeoutDateEpochSeconds extends TimeoutDate<number> {}

/** @deprecated Timeout specified as ISO 8601 date string  */
export interface TimeoutDateIso8601 extends TimeoutDate<string> {}

export interface ChannelTimeout<T> {
  channel?: T;
  provider?: T;
}

export type Content = ElementalContentSugar | ElementalContent;

export interface MessageDelayDuration {
  duration: string; // friendly ("1 hour"), milliseconds, ISO-8601 duration
  until?: never;
}

export interface MessageDelayUntil {
  duration?: never;
  until: string; // friendly ("Thursday at 10am"), Unix Epoch, ISO-8601 date-stamp w/ TZ
}

export type MessageDelay = MessageDelayDuration | MessageDelayUntil;

export interface MessageBrandV2 {
  version: "2022-05-17";
  colors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  logo?: {
    href?: string;
    image: string;
  };
  locales?: {
    [key: string]: Omit<MessageBrand, "locales" | "version">;
  };
}

export type MessageBrandV1 = Partial<Omit<IBrand, "version">> & {
  settings: IBrand["settings"];
  version?: "2020-06-19T18:51:36.083Z" | "2020-06-19";
};

export type MessageBrand = MessageBrandV1 | MessageBrandV2;

export interface BaseMessage {
  brand_id?: string;
  brand?: MessageBrand;
  channels?: MessageChannels;
  data?: MessageData;
  delay?: MessageDelay;
  metadata?: MessageMetadata;
  providers?: MessageProviders;
  routing?: MessageRouting;
  timeout?: Timeout;
  to: MessageRecipient;
}

interface TrackingOverride {
  open: boolean;
}
export interface MessageChannelEmailOverride {
  attachments?: Record<string, any>[];
  bcc?: string;
  // content?: Content; TODO: https://linear.app/trycourier/issue/C-4462/add-content-support-to-channel-overrides
  brand?: {
    snippets?: IBrandSnippets;
    settings?: {
      colors?: IBrandColors;
      email?: IBrandSettingsEmail;
    };
  };
  cc?: string;
  from?: string;
  html?: string;
  reply_to?: string;
  subject?: string;
  text?: string;
  tracking?: TrackingOverride;
}

export interface MessageChannelPushOverride {
  body?: string;
  brand?: {
    snippets?: IBrandSnippets;
    settings?: {
      colors?: IBrandColors;
      inapp?: IBrandSettingsInApp;
    };
  };
  // content?: Content; TODO: https://linear.app/trycourier/issue/C-4462/add-content-support-to-channel-overrides
  click_action?: string;
  data?: Record<string, any>;
  icon?: string;
  reply_to?: undefined;
  title?: string;
}

export interface MessageProviderConfig {
  override?: Record<string, any>;
  if?: string;
  timeout?: number;
  metadata?: {
    utm?: UTM;
  };
}

export interface MessageProviders {
  [provider: string]: MessageProviderConfig;
}

export interface MessageChannelConfig {
  brand_id?: string; // TODO: pick this up in prepare (like override)?
  providers?: string[];
  routing_method?: "all" | "single";
  if?: string;
  timeout?: number | ChannelTimeout<number>;
  metadata?: {
    utm?: UTM;
  };
  override?: MessageChannelEmailOverride | MessageChannelPushOverride;
}
export interface MessageChannels {
  [channel: string]: MessageChannelConfig;
}

export type MessageRoutingMethod = "all" | "single";
export type MessageRoutingChannel = string | MessageRouting;
export interface MessageRouting {
  method: MessageRoutingMethod;
  channels: MessageRoutingChannel[];
}

export interface UTM {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface UTMMap {
  message?: UTM;
  channels?: {
    [channel: string]: UTM;
  };
  providers?: {
    [provider: string]: UTM;
  };
}

export interface MessageMetadata {
  event?: string;
  tags?: string[];
  utm?: UTM;
  trace_id?: string;
}

export interface ContentMessage extends BaseMessage {
  content: Content;
}

export interface TemplateMessage extends BaseMessage {
  template: string;
}

export type Message = ContentMessage | TemplateMessage;

export enum SequenceActions {
  cancel = "cancel",
  emit = "emit",
  fetchData = "fetch-data",
  send = "send",
}

export interface SendSequenceAction {
  action: SequenceActions;
  message: Message;
}

export type Sequence = Array<SendSequenceAction>;
// | EmitSequenceAction
// | FetchDataSequenceAction
// | CancelSequenceAction>;

export interface MessageRequest {
  message: Message;
  sequence?: never;
}

export interface SequenceRequest {
  message?: never;
  sequence: Sequence;
}

export type RequestV2 = SequenceRequest | MessageRequest;
