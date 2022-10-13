/************************************************************************************************************
 * WARNING: This file should only be edited in `backend` and copied to `frontend/packages/components`
 ***********************************************************************************************************/

import { Value, ValueJSON } from "slate";

import * as BrandTypes from "./lib/brands/types";
import { Stripe } from "~/lib/stripe";
import { MessageStatus } from "./lib/message-service/types";
import {
  CourierRenderOverrides,
  TenantRouting,
  TenantScope,
} from "./types.internal";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export type JSONObject = { [key: string]: JSON };

export type JSON =
  | string
  | number
  | boolean
  | null
  | { [property: string]: JSON }
  | JSON[];

export interface IProfile {
  locale?: string;
  email?: string;
  phone_number?: string;
  [key: string]: any;
}

export type IBrand = BrandTypes.IBrand;
export type S3APIInput = {
  _meta: {
    tenantId: string;
    messageId: string;
  };
  brand?: BrandTypes.IBrand;
  courier?: CourierRenderOverrides;
  data?: object;
  event: string;
  override?: object;
  profile?: IProfile;
  recipient: string;
  scope: TenantScope;
  dryRunKey?: TenantRouting;
};

// Based on https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
export interface IOIDCClaims {
  address: Partial<{
    country: string;
    formatted: string;
    locality: string;
    postal_code: string;
    region: string;
    street_address: string;
  }>;
  birthdate: string;
  email: string;
  email_verified: boolean;
  family_name: string;
  gender: string;
  given_name: string;
  locale: string;
  middle_name: string;
  name: string;
  nickname: string;
  picture: string;
  phone_number: string;
  phone_number_verified: boolean;
  preferred_username: string;
  profile: string;
  sub: string;
  updated_at: number;
  website: string;
  zoneinfo: string;
}

// Based on https://segment.com/docs/connections/spec/identify/#traits
export interface ISegmentIdentifyTraits {
  address: {
    city: string;
    country: string;
    postalCode: string;
    state: string;
    street: string;
  };
  age: number;
  avatar: string;
  birthday: Date;
  company: {
    [key: string]: any;
  };
  createdAt: Date;
  description: string;
  email: string;
  firstName: string;
  gender: string;
  id: string;
  lastName: string;
  name: string;
  phone: string;
  title: string;
  username: string;
  website: string;
  [key: string]: any; // support additional propertieslastName?: string;
}

export type RecipientType = "audience" | "list" | "user";
export type IRecipient = IAudienceRecipient | IListRecipient | IUserRecipient;
interface IRecipientCommonFields {
  id: string;
  last_sent_at?: number;
  name?: string;
  recipientId?: string;
  tenantId: string;
  type: RecipientType;
  updated_at: number;
}
export interface IAudienceRecipient extends IRecipientCommonFields {
  count: number;
  type: "audience";
}
export interface IListRecipient extends IRecipientCommonFields {
  count: number;
  type: "list";
}
export interface IUserRecipient
  extends IRecipientCommonFields,
    Partial<IOIDCClaims> {
  first_name?: string;
  last_name?: string;
  type: "user";
  updated_at: number;
  // need to support camelCase for segment identify
  firstName?: string;
  lastName?: string;
}

// we will allow more from ISegmentIdentifyTraits down the road
export interface IRecipientFields extends IOIDCClaims {
  firstName?: string;
  lastName?: string;
  type?: RecipientType;
}

export interface IConfigurationJson {
  [key: string]:
    | (string | boolean)
    | { label: string; value: string }
    | IConfigurationJson;
  fromAddress?: string;
  provider: string;
  test?: IConfigurationJson;
}

export interface IFooterLinks {
  [icon: string]: string;
}

export type EmailTemplateName = "line" | "none" | "inbox";

interface ILogoRenderSize {
  width: number;
  height: number;
}

interface IEmailTemplateBaseConfig {
  footerLinks?: IFooterLinks;
  footerTemplateName?: string;
  headerLogoAlign?: string;
  headerLogoHref?: string;
  headerLogoRenderSize?: ILogoRenderSize;
  headerLogoSrc?: string;
  templateName?: EmailTemplateName;
  topBarColor?: string;
}

export type EmailTemplateConfig = IEmailTemplateBaseConfig & {
  footerText?: Value;
};
export type EmailTemplateWireConfig = IEmailTemplateBaseConfig & {
  footerText?: string;
};

export type FacebookMessengerConfig = {
  fromAddress?: string;
  tag: string;
};

export type FirebaseFcmConfig = {
  title: string;
};

export type AirshipConfig = {
  title?: string;
};

export type DiscordConfig = {
  messageId?: string;
  replyToMessageId?: string;
};

export type ExpoConfig = {
  subtitle?: string;
  title?: string;
};

export type BeamerConfig = {
  title?: string;
  category?: string;
};

export type ChatApiConfig = {
  quotedMsgId?: string;
  mentionedPhones?: string;
};

export type PusherConfig = {
  event?: string;
  title?: string;
  clickAction?: string;
  icon?: string;
};

export type PusherBeamsConfig = {
  userIds?: string[];
  interests?: string[];
  mode: Array<"apns" | "fcm" | "web">;
};

export type SlackConfig = {
  tsPath?: string;
  presenceChecking?: boolean;
};

export type SplunkOnCallConfig = {
  summary?: string;
};

export type StreamChatConfig = {
  channelId?: string;
  channelType?: string;
  messageId?: string;
};

export type OpsgenieConfig = {
  message?: string;
};

export type NowPushConfig = {
  device_type?: string;
  message_type?: string;
  note?: string;
  url?: string;
};

export type ApnConfig = {
  title?: string;
  topic?: string;
};

export type PushbulletConfig = {
  title?: string;
};

export type Align = "left" | "center" | "right";

export type ConditionalFilterOperator =
  | "CONTAINS"
  | "EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_EQUALS"
  | "IS_EMPTY"
  | "LESS_THAN"
  | "LESS_THAN_EQUALS"
  | "NOT_CONTAINS"
  | "NOT_EMPTY"
  | "NOT_EQUALS";

export interface IConditionalFilter {
  source: string;
  property: string;
  operator: ConditionalFilterOperator;
  value?: string;
  id?: string;
}

export interface IConditionalConfig {
  filters: IConditionalFilter[];
  logicalOperator?: "and" | "or";
  behavior?: "hide" | "show";
}

interface IBlockConfig {
  conditional?: IConditionalConfig;
}

interface IBlock {
  config: IBlockConfig;
  id: string;
  type: BlockType;
}

export type IAlignment = "center" | "left" | "right" | "full";
export type IActionColorStyle = "background" | "outline";
export type IActionBorderRadius = "0px" | "4px" | "9999px";
export type IActionButtonStyle = "button" | "link";

export interface IActionBlockConfig {
  actionId?: string;
  align: IAlignment;
  backgroundColor: string;
  conditional?: IConditionalConfig;
  href: string;
  style: IActionButtonStyle;
  text: string;
  useWebhook?: boolean;
  locales?: {
    [locale: string]: string;
  };
}

export interface IActionBlock extends IBlock {
  type: "action";
  config: IActionBlockConfig;
}

export interface IColumnBlockConfig {
  conditional?: IConditionalConfig;
  size: 2 | 3 | 4;
  layout: "left" | "right" | "center";
  width: string;
  columns?: Array<{
    border?: IBorderConfig;
    blockIds?: string[];
  }>;
}

export interface IColumnBlock extends IBlock {
  type: "column";
  config: IColumnBlockConfig;
}

export interface IDividerBlockConfig extends IBlockConfig {
  dividerColor?: string;
}

export interface IDividerBlock extends IBlock {
  type: "divider";
  config: IDividerBlockConfig;
}

export interface IImageBlockConfig extends IBlockConfig {
  align?: IAlignment;
  imageHref?: string;
  imagePath?: string;
  imageSrc?: string;
  altText?: string;
  width?: string;
}

export interface IImageBlock extends IBlock {
  type: "image";
  config: IImageBlockConfig;
}

export interface IJsonnetBlockConfig extends IBlockConfig {
  template: string;
}

export interface IJsonnetBlock extends IBlock {
  type: "jsonnet";
  config: IJsonnetBlockConfig;
}

export interface IListBlockChildConfig {
  imageHref?: string;
  imagePath?: string;
  path: string;
  value: Value;
}

export interface IListBlockTopConfig extends IListBlockChildConfig {
  background?: string;
}

export interface IListBlockConfig extends IBlockConfig {
  useChildren?: boolean;
  useImages?: boolean;
  useNumbers?: boolean;
  child?: IListBlockChildConfig;
  top: IListBlockTopConfig;
  locales?: {
    [locale: string]: {
      children?: Value;
      parent?: Value;
    };
  };
}

export interface IListBlock extends IBlock {
  type: "list";
  config: IListBlockConfig;
}

export interface IMarkdownBlockConfig extends IBlockConfig {
  value: Value;
  locales?: {
    [locale: string]: Value;
  };
}

export interface IMarkdownBlock extends IBlock {
  type: "markdown";
  config: IMarkdownBlockConfig;
}

export interface ITemplateBlockConfig extends IBlockConfig {
  template: string;
  locales?: {
    [locale: string]: string;
  };
}

export interface ITemplateBlock extends IBlock {
  type: "template";
  config: ITemplateBlockConfig;
}

export type TextStyle = "text" | "h1" | "h2" | "subtext";

export interface IQuoteBlockConfig extends IBlockConfig {
  align?: IAlignment;
  borderColor?: string;
  textStyle?: TextStyle;
  value: Value;
  locales?: {
    [locale: string]: Value;
  };
}

export interface IQuoteBlock extends IBlock {
  type: "quote";
  config: IQuoteBlockConfig;
}

export interface IBorderConfig {
  enabled?: boolean;
  color?: string;
  size?: string;
}
export interface ITextBlockConfig extends IBlockConfig {
  allowHbs?: boolean;
  align?: IAlignment;
  backgroundColor?: string;
  border?: IBorderConfig;
  repeatOn?: string;
  textStyle?: TextStyle;
  value: Value;
  locales?: {
    [locale: string]: Value;
  };
}

export interface ITextBlock extends IBlock {
  type: "text";
  config: ITextBlockConfig;
}

export interface ILineBlock extends IBlock {
  type: "line";
  config: ITextBlockConfig;
}

export interface EmailJsonParams {
  emailBCC?: string;
  emailCC?: string;
  emailFrom?: string;
  emailReplyTo?: string;
  emailSubject?: string;
  emailTemplateConfig?: EmailTemplateConfig;
  isUsingTemplateOverride?: boolean;
  templateOverride?: string;
  plainText?: boolean;
  payloadOverrideTemplate?: string;
}

export interface EmailJsonWireParams {
  emailBCC?: string;
  emailCC?: string;
  emailFrom?: string;
  emailReplyTo?: string;
  emailSubject?: string;
  emailTemplateConfig?: EmailTemplateWireConfig;
  isUsingTemplateOverride?: boolean;
  templateOverride?: string;
}

export type Block =
  | IActionBlock
  | IColumnBlock
  | IDividerBlock
  | IImageBlock
  | IJsonnetBlock
  | ILineBlock
  | IListBlock
  | IMarkdownBlock
  | IQuoteBlock
  | ITemplateBlock
  | ITextBlock;

export type BlockType = Block["type"];

export type BlockConfig = Block["config"];

export type EventJson = EmailJsonParams & {
  beamerConfig?: BeamerConfig;
  blocks: Block[];
  categoryId?: string;
  chatApiConfig?: ChatApiConfig;
  conditional?: IConditionalConfig;
  config?: INotificationConfig;
  expoConfig?: ExpoConfig;
  fbMessengerConfig?: FacebookMessengerConfig;
  draftId?: string;
  providers: {
    [provider: string]: {
      [slot: string]: string[];
    };
  };
  opsgenie?: OpsgenieConfig;
  pushbullet?: PushbulletConfig;
  splunkOnCall?: SplunkOnCallConfig;
  strategyId: string;
  streamChat?: StreamChatConfig;
  tagIds?: Array<string>;
  testEvents?: Array<ITestEvent>;
  apn?: ApnConfig;
};

export interface BlockWire {
  alias?: string;
  config: string;
  id: string;
  type: BlockType;
  context?: string;
}

export type EventJsonWire = EmailJsonParams & {
  beamerConfig?: BeamerConfig;
  blocks: BlockWire[];
  brandConfig?: INotificationBrandConfig;
  chatApiConfig?: ChatApiConfig;
  categoryId?: string;
  conditional?: IConditionalConfig;
  config?: INotificationConfig;
  expoConfig?: ExpoConfig;
  fbMessengerConfig?: FacebookMessengerConfig;
  draftId?: string;
  providers: {
    [provider: string]: {
      [slot: string]: string[];
    };
  };
  opsgenie?: OpsgenieConfig;
  pushbullet?: PushbulletConfig;
  splunkOnCall?: SplunkOnCallConfig;
  strategyId: string;
  streamChat?: StreamChatConfig;
  tagIds?: Array<string>;
  testEvents?: Array<ITestEvent>;
  apn?: ApnConfig;
};

export interface IChannelProviderConfiguration {
  airship?: AirshipConfig;
  beamer?: BeamerConfig;
  chatApi?: ChatApiConfig;
  discord?: DiscordConfig;
  expo?: ExpoConfig;
  fbMessenger?: FacebookMessengerConfig;
  firebaseFcm?: FirebaseFcmConfig;
  pusher?: PusherConfig;
  pusherBeams?: PusherBeamsConfig;
  opsgenie?: OpsgenieConfig;
  pushbullet?: PushbulletConfig;
  slack?: SlackConfig;
  splunkOnCall?: SplunkOnCallConfig;
  streamChat?: StreamChatConfig;
  apn?: ApnConfig;
}

export interface IChannelProvider {
  conditional?: IConditionalConfig;
  config?: IChannelProviderConfiguration;
  configurationId?: string; // reference to provider configuration (provider instance id)
  key: string;
}

export interface IPushConfig {
  title: string;
  icon: string;
  clickAction: string;
}

export interface IChannelConfiguration {
  email?: EmailJsonParams;
  push?: IPushConfig;
  locales?: {
    [locale: string]: {
      subject?: string;
      title?: string;
    };
  };
}

export interface IChannel {
  blockIds: Array<string>;
  slots?: {
    [key: string]: Array<string>;
  };
  conditional?: IConditionalConfig;
  config?: IChannelConfiguration;
  disabled?: boolean;
  id: string;
  label?: string; // alias
  providers: Array<IChannelProvider>;
  // name and icon will be based on taxonomy
  // supported/desired taxonomy (eg: direct_message:*:* | direct_message:sms:twilio)
  taxonomy: string;
}

export interface IChannels {
  always: Array<IChannel>;
  bestOf: Array<IChannel>;
}

export interface ITag {
  id: string;
  label: string;
  color: string;
  created: number;
  tenantId: string;
}

export interface INotificationConfig {
  type: "REQUIRED" | "OPT_IN" | "OPT_OUT";
  inheritConfig?: boolean;
  required?: boolean;
}

export interface INotificationCategoryJson {
  notificationConfig: INotificationConfig;
}

export type NotificationCategory = CourierObject<INotificationCategoryJson>;

export interface ITestEvent {
  id: string;
  label: string;
  profile: IProfile;
  data: object;
  override?: object;
}

export interface INotificationBrandConfig {
  enabled: boolean;
  defaultBrandId?: string;
}
export interface INotificationJson {
  __legacy__strategy__id__?: string;
  blocks: Array<Block>;
  brandConfig?: INotificationBrandConfig;
  categoryId?: string;
  channels: IChannels;
  conditional?: IConditionalConfig;
  config?: INotificationConfig;
  draftId?: string;
  tagIds?: Array<string>;
  testEvents?: Array<ITestEvent>;
}

export interface INotificationDraftJson {
  blocks: Array<BlockWire>;
  brandConfig?: INotificationBrandConfig;
  canceled?: number;
  channels: IChannels;
  notificationId?: string;
  submitted?: number;
  publishMessage?: string;
  published?: number;
}

export interface ICheckConfig {
  enabled: boolean;
  id: string;
  resolutionKey?: string;
  type: "custom";
}

export interface INotificationJsonWire {
  __legacy__strategy__id__?: string;
  blocks: Array<BlockWire>;
  brandConfig?: INotificationBrandConfig;
  canceled?: number;
  categoryId?: string;
  channels: IChannels;
  checkConfigs?: ICheckConfig[];
  conditional?: IConditionalConfig;
  config?: INotificationConfig;
  draftId?: string;
  preferenceTemplateId?: string;
  sourceTimestamp?: number;
  submitted?: number;
  tagIds?: Array<string>;
  testEvents?: ITestEvent[];
}

export interface StrategyJson {
  always?: string[];
  configurations: string[];
}

export interface InvitationJson {
  code: string;
  email: string;
  role?: string;
  isRequest?: boolean;
}

export type BetaAccessCodesPostRequest = {
  code: string;
};
export type BetaAccessCodesPostResponse = {
  success: boolean;
};

export type VerifyInvitationResponse = {
  tenantId: string;
};

export type TenantsPostResponse = {
  id: string;
  name: string;
  welcomeTemplateId?: string;
};

export type TenantDiscoverability =
  | "RESTRICTED"
  | "NEEDS_ACCESS_REQUEST"
  | "FREE_TO_JOIN"
  | "NEEDS_CONTACT_IT";

export type TenantGetResponse = {
  clickThroughTracking: IClickThroughTrackingSettings;
  customerRoutes: ICustomerRoutes;
  emailOpenTracking: IEmailOpenTrackingSettings;
  id: string;
  name: string;
  authTokens: string[];
  owner: string;
  discoverable?: TenantDiscoverability;
  showCourierFooter?: boolean;
  hideSetupProgress?: boolean;
  domains: string[];
};

export type IUserSsoProvider = "github" | "google" | `custom:${string}`;
export type IUserProvider = IUserSsoProvider | "email";

export interface User {
  id?: string;
  email: string;
  provider?: IUserProvider;
}

type StripeSubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "trialing"
  | "unpaid";

export interface IStripePaymentCard {
  brand: string;
  exp_month: number;
  exp_year: number;
  last4: string;
}

export interface IStripeSubscriptionTier {
  flat_amount: number;
  flat_amount_decimal: string;
  unit_amount: number;
  unit_amount_decimal: string;
  up_to: number;
}

export interface IStripeInformation {
  stripeCurrentPeriodEnd?: number;
  stripeCurrentPeriodStart?: number;
  stripeCustomerId?: string;
  stripeLastInvoiceUsage?: number;
  stripePaymentMethod?: {
    id: string;
    card: IStripePaymentCard;
  };
  stripeSubscriptionItemId?: string;
  stripeSubscriptionItemPriceId?: string;
  stripeSubscriptionStatus?: StripeSubscriptionStatus;
  stripeSubscriptionTiers?: IStripeSubscriptionTier[];
}

export interface ITenant extends ITenantDynamoObject {
  isOverSendLimit?: boolean;
  isInGracePeriod?: boolean;
}

export interface ITenantDynamoObject extends IStripeInformation {
  archived?: number;
  apiKey?: string;
  brandsAccepted?: boolean;
  channelInterests?: string[];
  clickThroughTracking?: IClickThroughTrackingSettings;
  created: number;
  creator: string;
  customerRoutes?: ICustomerRoutes;
  defaultBrandId?: string;
  discoverable?: TenantDiscoverability;
  emailOpenTracking?: IEmailOpenTrackingSettings;
  // future support for "github" aswell maybe
  requireSso?: IUserSsoProvider;
  domains?: string[];
  googleSsoDomain?: string;
  gracePeriodEnd?: number;
  gracePeriodStart?: number;
  hideSetupProgress?: boolean;
  currentOnboardingStep?: string;
  name: string;
  notificationLastSentAt?: number;
  owner?: string;
  referral_source?: string;
  showCourierFooter?: boolean;
  stackLang?: string;
  tenantId: string;
  usageActual?: number;
  usageCurrentPeriod?: number;
  usageReported?: number;
  workspaceOwnerRole?: string;
}

export interface IUpdatePaymentMethodRequest extends Stripe.PaymentMethod {}

export type TenantsListUsersResponse = {
  users: User[];
};

export type TenantsGetResponseTenant = {
  invitationCode?: string;
  name: string;
  requireSso?: string;
  tenantId: string;
  userCount?: number;
  discoverable?: TenantDiscoverability;
};

export type TenantsGetResponse = {
  available: TenantsGetResponseTenant[];
  invited: TenantsGetResponseTenant[];
  tenants: TenantsGetResponseTenant[];
};

export type TenantsListAltAccountsResponse = {
  altAccounts: IUserProvider[];
  currentProvider: IUserProvider;
};

export type CreateCourierObject<T = any> = {
  id?: string;
  json: T;
  sourceTimestamp?: number;
  title?: string;
};

export type CourierObject<T = any> = {
  archived?: boolean;
  created: number;
  creator: string;
  id: string;
  json: T;
  objtype: string;
  sourceTimestamp?: number;
  tenantId: string;
  title: string;
  updated?: number;
  updater?: string;
};

export type ObjectPostRequest = {
  type: string;
  title: string;
  json: any;
};
export type ObjectPostResponse = CourierObject;
export type ObjectPatchRequest = {
  title: string;
  json: any;
};
export type ObjectPatchResponse = {
  title: string;
  json: any;
};
export type ObjectListResponse = {
  objects: CourierObject[];
};
export interface IObjectListParams {
  count?: boolean; // return item count instead of item objects
  archived?: boolean; // filter out the archived items (defaults to true)
  strategyId?: string; // available only for events
}
export type ObjectGetResponse = CourierObject;

export type ObjectDeleteRequest = {
  id: string;
};
export type ObjectDeleteResponse = {};

export interface ObjectDuplicateRequest {}
export type ObjectDuplicateResponse = CourierObject<EventJsonWire>;

export type IdParameter = {
  id: string;
};

export type GetPresignedPostDataRequest = {
  key: string;
  contentType: string;
};

export type GetPresignedPostDataResponse = {
  presignedPostData: any;
};

export type EventLogEntryType =
  | "event:archived"
  | "event:delayed"
  | "event:delayed"
  | "event:click"
  | "event:filtered"
  | "event:notificationId"
  | "event:opened"
  | "event:prepared"
  | "event:read"
  | "event:received"
  | "event:receivedSendTopic"
  | "event:routed"
  | "event:unmapped"
  | "event:unread"
  | "polling:attempt"
  | "polling:error"
  | "profile:loaded"
  | "provider:attempt"
  | "provider:delivered"
  | "provider:delivering"
  | "provider:error"
  | "provider:rendered"
  | "provider:sent"
  | "provider:simulated"
  | "retrying"
  | "timedout"
  | "undeliverable"
  | "unroutable"
  | "webhook:response";

export interface IEventLogEntryJson {
  [key: string]: any;
  headers?: {
    [key: string]: string;
  };
  clickHeaders?: {
    [key: string]: string;
  };
}

export interface IEventLogEntry {
  id: string;
  json: IEventLogEntryJson;
  messageId: string;
  tenantId: string;
  timestamp: number;
  type: EventLogEntryType;
}

export type PartialMessage = {
  enqueued: number;
  errorCount?: number;
  eventId: string;
  messageId: string;
  notificationId: string;
  provider?: string;
  providers?: DocumentClient.DynamoDbSet;
  readTimestamp?: number;
  recipientEmail?: string;
  recipientId: string;
  status: MessageStatus;
  tags?: string[];
  tenantId: string;
  channels?: DocumentClient.DynamoDbSet;
};

export type FullMessage = PartialMessage & {
  archivedTimestamp?: number;
  clicked?: number;
  configuration?: string;
  delivered?: number;
  errorMessage?: string;
  jobId?: string;
  logs?: IEventLogEntry[];
  opened?: number;
  sent?: number;
  tenantId: string;
  listId?: string;
  listMessageId?: string;
};

export type EsResponse<T> = {
  items: T[];
  next?: string;
  prev?: string;
};

export type GetMessageResponse = FullMessage;
export type ListMessagesResponse = {
  messages: PartialMessage[];
  next?: string;
  prev?: string;
  total?: number;
};

export type PostTagResponse = {
  id: string;
};
export type PutTagResponse = {
  id: string;
};
export type GetTagResponse = {
  color: string;
  label: string;
};
export type ListTagsResponse = {
  tags: ITag[];
};

export interface IEventMap {
  created: number;
  creator: string;
  eventId: string;
  notifications: Array<{ notificationId: string }>;
  tenantId: string;
  updated: number;
  updator: string;
}

export interface IEventMapsListResponse {
  eventMaps: IEventMap[];
}

export interface IEventMapsCreateRequest {
  eventId: string;
  notifications?: Array<{ notificationId: string }>;
}

export interface IEventMapsUpdateRequest {
  eventId?: string;
  notifications?: Array<{ notificationId: string }>;
}

export type IConfiguration = CourierObject<IConfigurationJson>;

export type INotification = CourierObject<INotificationJson>;
export type INotificationWire = CourierObject<INotificationJsonWire>;

export type ILegacyNotification = CourierObject<EventJson>;
export type ILegacyNotificationWire = CourierObject<EventJsonWire>;

export type IStrategy = CourierObject<StrategyJson>;
export interface ITrackingSettings {
  enabled: boolean;
}

export interface IClickThroughTrackingSettings extends ITrackingSettings {}

export interface IEmailOpenTrackingSettings extends ITrackingSettings {}

export interface ICustomerRoutes {
  hmacEnabled: boolean;
}

export type OnboardingInfoGetResponse = {
  tenantHasEngineer: boolean;
  tenantNotificationSendCount: number;
  userRole: string;
};

export type CheckStatus = "RESOLVED" | "FAILED" | "PENDING";

export interface ICheck {
  id: "custom";
  status: CheckStatus;
  type: "custom";
  updated: number;
}

export interface ITemplateLocaleBlock {
  id: string;
  type: BlockType;
  content: ValueJSON | string | { parent?: ValueJSON; children?: ValueJSON };
}

export interface ITemplateLocaleChannelContent {
  subject?: string;
  title?: string;
}

export interface ITemplateLocaleChannel {
  id: string;
  content: ITemplateLocaleChannelContent;
}

export interface ITemplateLocales {
  [locale: string]: {
    blocks: ITemplateLocaleBlock[];
    channels?: ITemplateLocaleChannel[];
  };
}
