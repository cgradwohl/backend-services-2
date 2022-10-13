import { ISerializableBlock } from "~/lib/blocks/serialize";
import { IBrand } from "./lib/brands/types";
import * as PublicTypes from "~/types.public.d";
import {
  CourierObject,
  EventLogEntryType,
  IClickThroughTrackingSettings,
  IEmailOpenTrackingSettings,
  IConfigurationJson,
  NotificationCategory,
  INotificationWire,
  JSON,
  JSONObject,
  StripeSubscriptionStatus,
  IProfile,
  IChannel,
} from "~/types.api";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IListItem } from "./lib/lists/types";
import { RoutingTree } from "~/types.public.d";

export type ChannelDetails = {
  id?: IChannel["id"];
  taxonomy: IChannel["taxonomy"];
  label?: IChannel["label"];
};
interface ICustomerTenantLookup {
  created: number;
  customerId: string;
  tenantId: string;
}

export interface ICacheVariation {
  brand: number;
  configurations: number;
  drafts: number;
  notification: number;
}

export type ValueOf<T> = T[keyof T];

export interface IDataDictionary {
  get: (key: string) => string | undefined;
  getRepeatable: (key: string) => object[];
  hasKey: (key: string) => boolean;
  resolve: IVariableResolver;
}

export type SerializerType = "plain" | "slack" | "html" | "md";

export interface IVariableResolver {
  (text: string, scope?: object): string;
}

type ISlackTypes =
  | "section"
  | "actions"
  | "button"
  | "image"
  | "divider"
  | "header";
type ISlackTextTypes = "mrkdwn" | "plain_text";

interface ISlackText {
  emoji?: boolean;
  text?: string;
  type: ISlackTextTypes;
  url?: string;
}

export interface ISlackBlock {
  action_id?: string;
  elements?: ISlackBlock[];
  text?: ISlackText;
  type: ISlackTypes;
  url?: string;
}

export interface ISlackImageBlock {
  type: "image";
  title?: {
    type: "plain_text";
    text: string;
  };
  alt_text: string;
  image_url: string;
}

export type IBlockRendererResponse = string | ISlackBlock;

export interface IBlockRenderer {
  (
    block: ISerializableBlock,
    serializerType: SerializerType,
    brand?: IBrand
  ): IBlockRendererResponse;
}

export type RetryableMessageType =
  | "check-delivery-status"
  | "prepare"
  | "route";

export interface IRetryableSqsMessage<T extends RetryableMessageType> {
  messageId: string;
  retryCount?: number;
  tenantId: string;
  type: T;
  ttl?: number;
}

export interface S3CheckDeliveryStatusMessage {
  providerResponse?: object;
}

export interface SqsCheckDeliveryStatusMessage
  extends IRetryableSqsMessage<"check-delivery-status"> {
  channel?: IChannel;
  configuration: string;
  externalId: string;
  messageLocation:
    | { path: string; type: "S3" }
    | { path: S3CheckDeliveryStatusMessage; type: "JSON" };
  provider: string;
}

export interface LegacySqsCheckDeliveryStatusMessage
  extends Omit<SqsCheckDeliveryStatusMessage, "messageLocation"> {
  providerResponse?: object;
}

export interface SqsCreateStripeUsageRecord {
  idempotencyKey: string;
  increment: number;
  stripeCustomerId: string;
  stripeSubscriptionItemId: string;
  stripeSubscriptionStatus: StripeSubscriptionStatus;
  tenantId: string;
  timestamp: number;
}

export interface SqsTestNotificationMessage {
  brandId?: string;
  channelId: string;
  courier: CourierRenderOverrides;
  draftId: string;
  eventData: JSONObject;
  eventProfile: JSONObject;
  messageId: string;
  notificationId: string;
  recipientId: string;
  tenantId: string;
  userPoolId?: string;
  users?: Array<string>;
}

export interface ApiV2ToSchema {
  list_id?: string;
  email?: string;
  phone_number?: string;
  user_id?: string;
}
export interface LocalesSchema {
  [locale: string]: string;
}

export interface ApiV2TextBlock {
  block: "text" | "quote";
  text: string;
  locales?: LocalesSchema;
}

export interface ApiV2ActionBlock {
  block: "action";
  text: string;
  href: string;
  config?: {
    align?: "left" | "right" | "center";
    backgroundColor?: string;
  };
  locales?: LocalesSchema;
}

export interface ApiV2TitleSchema {
  text: string;
  locales?: LocalesSchema;
}

type ApiV2ContentBlock = ApiV2TextBlock | ApiV2ActionBlock;
export interface ApiV2ContentSchema {
  id?: string;
  title?: string | ApiV2TitleSchema;
  body?: string | ApiV2ContentBlock[];
}
interface ApiV2EmailChannelConfig {
  bcc?: string;
  cc?: string;
  from?: string;
  replyTo?: string;
}
interface ApiV2Channels {
  email?: {
    content?: ApiV2ContentSchema;
    config?: ApiV2EmailChannelConfig;
  };
  push?: {
    content?: ApiV2ContentSchema;
  };
}
interface BaseApiV2RequestMessage {
  channels?: ApiV2Channels;
  template?:
    | string
    | {
        brand?: string;
        id: string;
      };
  content?: ApiV2ContentSchema;
  data?: Record<string, any>;
  routing?: RoutingTree;
}
interface ApiV2RequestMessage extends BaseApiV2RequestMessage {
  to: ApiV2ToSchema | ApiV2ToSchema[];
}

interface ApiV2RoutedRequestMessage extends BaseApiV2RequestMessage {
  to: ApiV2ToSchema;
}
export interface ApiV2Schema {
  message: ApiV2RequestMessage;
  messageId: string;
}

export interface IInboundAction {
  eventId: string;
  payload: ApiV2RoutedRequestMessage;
  type: "send" | "send-list";
}

export interface SqsPrepareMessage extends IRetryableSqsMessage<"prepare"> {
  messageLocation:
    | { path: string; type: "S3" }
    | { path: S3PrepareMessage; type: "JSON" };
  shouldVerifyRequestTranslation?: boolean;
  translated?: boolean;
}

export interface SqsSendListOrPatternMessage {
  lastEvaluatedKey?: DocumentClient.Key;
  messageId: string;
  messageLocation:
    | { path: string; type: "S3" }
    | { path: S3SendListOrPatternMessage; type: "JSON" };
  originalMessageId: string;
  tenantId: string;
  type: string;
}

export interface SqsRouteMessage extends IRetryableSqsMessage<"route"> {
  messageLocation:
    | { path: string; type: "S3" }
    | { path: S3Message; type: "JSON" };
  shouldVerifyRequestTranslation?: boolean;
  translated?: boolean;
}

export interface S3SendListOrPatternMessage {
  brand: IBrand;
  dataSource?: PublicTypes.IApiDataSourceConfig;
  dryRunKey?: TenantRouting;
  eventData: JSONObject;
  eventId: string;
  eventPreferences?: PublicTypes.IProfilePreferences;
  list?: IListItem;
  override?: PublicTypes.ApiSendRequestOverride;
  pattern?: string;
  scope: TenantScope;
}

export interface SqsUpdateReportedUsageMessage {
  stripeCustomerId: string;
  stripeSubscriptionItemId: string;
  stripeSubscriptionStatus: StripeSubscriptionStatus;
  tenantId: string;
  usageActual: number;
  usageReported: number;
}

export type CourierRenderOverrides = {
  environment: "production" | "test";
  scope: "draft" | "submitted" | "published";
};

export type S3Message = {
  brand?: IBrand;
  category?: NotificationCategory;
  routing?: RoutingTree;
  clickThroughTracking?: IClickThroughTrackingSettings;
  configurations: CourierObject<IConfigurationJson>[];
  content?: ApiV2ContentSchema;
  courier?: CourierRenderOverrides;
  data: JSONObject;
  emailOpenTracking?: IEmailOpenTrackingSettings;
  eventId: string;
  extendedProfile: JSONObject;
  notification?: INotificationWire;
  override?: PublicTypes.ApiSendRequestOverride;
  preferences?: PublicTypes.IProfilePreferences;
  profile: JSONObject;
  recipientId: string;
  dryRunKey?: TenantRouting;
  scope: TenantScope;
  sentProfile: JSON;
};

export type S3PrepareMessage = {
  brandId?: string;
  brand?: IBrand;
  eventData?: JSONObject;
  eventId: string;
  eventPreferences?: PublicTypes.IProfilePreferences;
  eventProfile?: IProfile;
  override?: PublicTypes.ApiSendRequestOverride;
  recipientId: string;
  dryRunKey?: TenantRouting;
  scope?: TenantScope;
};

export type TenantRouting = "default" | "mock" | undefined;

interface ICodeServiceObject<T> {
  objtype: string;
  code: string;
  data: T;
  expires: number;
  ttl: number;
}

export type IVerificationCodeObject = ICodeServiceObject<{
  email: string;
  tenantId: string;
  userId: string;
  role?: string;
}>;

export type InvitationObject = {
  tenantId: string;
  code: string;
};

export interface IArchiveInvitationFn<T> {
  (params: {
    tenantId: string;
    code: string;
    id?: string;
    email?: string;
    userId?: string;
  }): Promise<void>;
}

export interface ITrackingRecordData {
  actionId?: string;
  context: string;
  href?: string;
  text?: string;
}

export interface ITrackingRecord {
  channel?: Partial<IChannel>;
  channelId?: string;
  data?: ITrackingRecordData;
  messageId: string;
  notificationId: string;
  providerId: string;
  providerKey: string;
  recipientId: string;
  tenantId: string;
  trackingHref: string;
  trackingId: string;
  type:
    | "CLICK_TRACKING"
    | "DELIVER_TRACKING"
    | "OPEN_TRACKING"
    | "READ_TRACKING"
    | "UNREAD_TRACKING"
    | "CHANNEL_TRACKING"
    | "ARCHIVE_TRACKING"
    | "UNSUBSCRIBE_TRACKING";
}

export interface ISafeEventLogEntry<T = string | { path: string; type: "S3" }> {
  id: string;
  json: T;
  messageId: string;
  tenantId: string;
  timestamp: number;
  type: EventLogEntryType;
}

export type TenantScope =
  | "draft/production"
  | "draft/test"
  | "published/production"
  | "published/test"
  | "submitted/production"
  | "submitted/test";

export interface SqsReceivedMessage {
  messageId: string;
  s3Path: string;
  tenantId: string;
  retryCount?: number;
  ttl?: number;
  messageType:
    | "message:prepare"
    | "message:route"
    | "message:render"
    | "message:send";
}

type S3ObjectPath = string;
