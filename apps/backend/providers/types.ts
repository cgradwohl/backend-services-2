import { TemplateDelegate } from "handlebars";
import { TimeoutDateEpochSeconds } from "~/api/send/types";
import { IProviderTemplateHandlers } from "~/handlebars/template";
import {
  ITemplateHandler,
  ITemplateHandlerReturnTypes,
  TemplateConfig,
  TemplateHandlerType,
} from "~/handlebars/template/types";
import { ISerializableBlock } from "~/lib/blocks/serialize";
import { ILinkHandler } from "~/lib/link-handler";
import {
  MessageStatusReason,
  MessageStatusReasonCode,
} from "~/lib/message-service/types";
import { RecipientToken, TokensByProvider } from "~/lib/token-storage";
import { IVariableHandler } from "~/lib/variable-handler";
import { ISendMessageContext } from "~/send/types";
import {
  AirshipConfig,
  ApnConfig,
  BeamerConfig,
  ChatApiConfig,
  CourierObject,
  DiscordConfig,
  EmailJsonParams,
  ExpoConfig,
  FacebookMessengerConfig,
  FirebaseFcmConfig,
  IBrand,
  IChannel,
  IChannelProvider,
  IConfigurationJson,
  IProfile,
  ITenant,
  JSONObject,
  OpsgenieConfig,
  NowPushConfig,
  PushbulletConfig,
  SlackConfig,
  SplunkOnCallConfig,
  StreamChatConfig,
} from "~/types.api";
import { CourierRenderOverrides, ValueOf } from "~/types.internal";
import * as PublicTypes from "~/types.public";

export type DeliveryHandlerParams = EmailJsonParams & {
  brand?: IBrand;
  channel?: IChannel;
  channelOverride?: ValueOf<
    PublicTypes.ApiSendRequestOverrideChannel["channel"]
  >;
  airshipConfig?: AirshipConfig;
  apnConfig?: ApnConfig;
  beamerConfig?: BeamerConfig;
  chatApiConfig?: ChatApiConfig;
  channelTrackingUrl?: string;
  config: CourierObject<IConfigurationJson>["json"];
  discordConfig?: DiscordConfig;
  eventId?: string;
  expoConfig?: ExpoConfig;
  extendedProfile?: JSONObject;
  handlebars?: {
    partials: { [partial: string]: TemplateDelegate };
  };
  fbMessengerConfig?: FacebookMessengerConfig;
  firebaseFcmConfig?: FirebaseFcmConfig;
  linkHandler?: ILinkHandler;
  messageId?: string;
  opsgenieConfig?: OpsgenieConfig;
  nowpushConfig?: NowPushConfig;
  override?: PublicTypes.ApiSendRequestOverrideInstance;
  profile: JSONObject;
  pushbulletConfig?: PushbulletConfig;
  recipient?: string;
  tags?: ISendMessageContext["metadata"]["tags"];
  trackingIds?: {
    channelTrackingId: string;
    clickTrackingId: string;
    deliverTrackingId: string;
    readTrackingId: string;
    archiveTrackingId?: string;
  };
  sentProfile?: JSONObject;
  slackConfig?: SlackConfig;
  splunkOnCallConfig?: SplunkOnCallConfig;
  streamChatConfig?: StreamChatConfig;
  tenant?: ITenant;
  tenantId?: string;
  variableData: {
    courier?: CourierRenderOverrides;
    data?: any;
    event?: string;
    profile: IProfile;
    recipient?: string;
    urls?: {
      opened: string;
    };
    maxAge?: TimeoutDateEpochSeconds;
    tokens?: Record<string, RecipientToken[]>;
  };
  variableHandler?: IVariableHandler;
};

export type DeliveryHandler = (
  params: DeliveryHandlerParams,
  templates: { [key: string]: any }
) => Promise<object | undefined>;

export type TaxonomyChannel =
  | "direct_message"
  | "email"
  | "push"
  | "webhook"
  | "banner"
  | "inbox";
export type TaxonomyClass = "sms";

export interface IChannelTaxonomy {
  channel: TaxonomyChannel;
  channels?: TaxonomyChannel[];
  class?: TaxonomyClass;
}

export type IProviderLinkDiscoveryHandler = (
  blocks: ISerializableBlock[],
  params: DeliveryHandlerParams
) => void;

export type IProviderRenderHandler = (
  blocks: ISerializableBlock[],
  params: DeliveryHandlerParams
) => any;

export type GetReferenceFn = (
  providerSentResponse: object,
  providerDeliveredResponse: object
) => { [key: string]: string };
export type HandlesFn = (params: {
  config: CourierObject<IConfigurationJson>;
  data?: JSONObject;
  profile?: JSONObject;
  providerConfig?: IChannelProvider["config"];
  tokensByProvider?: TokensByProvider;
}) => boolean | Promise<boolean | string>;
export type GetExternalIdFn = (providerResponse?: object) => string;
export type DeliveryStatus =
  | "DELIVERED"
  | "SENT"
  | "SENT_NO_RETRY"
  | "UNDELIVERABLE";
export type GetDeliveryStatusEnabledFn = (
  config: CourierObject<IConfigurationJson>
) => boolean;
export type DeliveryStatusStrategy =
  | "DELIVER_IMMEDIATELY"
  | "POLLING"
  | "WEBHOOK";
export type GetDeliveredTimestamp = (
  providerResponse?: object | string
) => number;

export type GetDeliveryStatusFn = (
  externalId: string,
  configuration: CourierObject<IConfigurationJson>,
  tenantId: string
) => Promise<{
  reason?: Extract<MessageStatusReason, "BOUNCED" | "FAILED"> | string;
  reasonCode?: MessageStatusReasonCode;
  reasonDetails?: string;
  response?: { [key: string]: any };
  status: DeliveryStatus;
}>;

export interface IDeliveryStatus {
  deliveryStatusStrategy?: DeliveryStatusStrategy;
  getExternalId?: GetExternalIdFn;
  getDeliveredTimestamp?: GetDeliveredTimestamp;
  getDeliveryStatus?: GetDeliveryStatusFn;
  getDeliveryStatusEnabled?: GetDeliveryStatusEnabledFn;
  getDeliveryStatusIntervalOverrides?: {
    date?: number;
    intervalMap: Map<number, number>;
  };
}

export interface IProvider extends IDeliveryStatus {
  getReference?: GetReferenceFn;
  handles: HandlesFn;
  taxonomy?: IChannelTaxonomy;
}

export interface GetTemplatesOptions {
  taxonomy?: string;
  locales?: {
    [locale: string]: {
      subject?: string;
      title?: string;
    };
  };
}

export type GetTemplatesFn<T extends ITemplates> = (
  templates: IProviderTemplateHandlers,
  config: TemplateConfig,
  options?: GetTemplatesOptions
) => {
  [key in keyof T]: ITemplateHandler<T[key]>;
};

export type SendFn<T extends ITemplates> = (
  params: DeliveryHandlerParams,
  renderedTemplates: { [key in keyof T]: ITemplateHandlerReturnTypes[T[key]] }
) => Promise<object | undefined>;

export interface ITemplates {
  [key: string]: TemplateHandlerType;
}

export interface IProviderWithTemplatesBase extends IDeliveryStatus {
  getReference?: GetReferenceFn;
  handles: HandlesFn;
  taxonomy: IChannelTaxonomy;
}

export interface IProviderWithTemplatesBaseRoutable {
  getTemplates: (
    templates: Partial<IProviderTemplateHandlers>,
    config: TemplateConfig,
    options?: GetTemplatesOptions
  ) => { [template: string]: ITemplateHandler<TemplateHandlerType> };
}

export interface IProviderWithTemplates<T extends ITemplates>
  extends IProviderWithTemplatesBaseRoutable {
  getTemplates: GetTemplatesFn<T>;
}
