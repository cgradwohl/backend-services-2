import { Kinesis } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
  Content,
  MessageChannels,
  MessageData,
  MessageMetadata,
  Recipient,
  RequestV2,
  TimeoutDateEpochSeconds,
  UTMMap,
} from "~/api/send/types";
import { IRenderedTemplatesMap } from "~/handlebars/template/render-templates";
import {
  IBrandColors,
  IBrandSettingsEmail,
  IBrandSnippets,
} from "~/lib/brands/types";
import { PricingPlan } from "~/lib/plan-pricing";
import {
  RouteNode,
  RouteNodeAddress,
  RouteTimeoutTable,
  RoutingStrategy,
  SendTimes,
} from "~/lib/send-routing";
import { TokensByProvider } from "~/lib/token-storage";
import { DeliveryHandlerParams } from "~/providers/types";
import {
  IBrand,
  IConfiguration,
  INotificationWire,
  IProfile,
  ITenant,
  NotificationCategory,
} from "~/types.api";
import {
  CourierRenderOverrides,
  TenantRouting,
  TenantScope,
} from "~/types.internal";
import { IProfilePreferences } from "~/types.public";

export type ApiVersion = "2019-04-01" | "2021-11-01";

export interface IRequest {
  apiVersion: ApiVersion;
  dryRunKey: TenantRouting;
  idempotencyKey: string | undefined;
  jobId?: string;
  params?: Record<"originalRequestId", string>;
  request: RequestV2;
  requestId: string;
  scope: TenantScope;
  source?: string;
  translated?: boolean;
}

export interface IMessage {
  apiVersion: ApiVersion;
  idempotencyKey: string | undefined;
  jobId?: string;
  messageId: string;
  message: RequestV2["message"];
  requestId: string;
  sequenceId?: string;
  sequenceActionId?: string;
  nextSequenceActionId?: string;
  source?: string;
}

export interface ISendProviderPayload {
  command: "send";
  channel: string;
  channelId: string;
  contextFilePath: string;
  dryRunKey: string;
  messageId: string;
  outputFilePath: string;
  messageFilePath: string;
  configurationId: string;
  tenantId: string;
  requestId: string;
  address?: RouteNodeAddress;
  times?: SendTimes;
  translated?: boolean;
}

export interface IRenderProviderPayload {
  command: "render";
  channel: string;
  channelId?: string;
  dryRunKey: string;
  contextFilePath: string;
  messageId: string;
  messageFilePath: string;
  configurationId: string;
  requestId: string;
  tenantId: string;
  address?: RouteNodeAddress;
  times?: SendTimes;
  shouldVerifyRequestTranslation: boolean;
  translated: boolean;
}

export type Command =
  | "request"
  | "accept"
  | "ad-hoc-list"
  | "send-audiences-member"
  | "send-audiences"
  | "list-pattern"
  | "list"
  | "prepare"
  | "render"
  | "route"
  | "send"
  | "sequence";

export enum SendActionCommands {
  Request = "request",
  Accept = "accept",
  Prepare = "prepare",
  Route = "route",
  Render = "render",
  Send = "send",
}

export interface ActionCommands {
  "ad-hoc-list": (action: IAdHocListAction) => Promise<void>;
  "send-audiences-member": (
    action: ISendAudiencesMemberAction
  ) => Promise<void>;
  "send-audiences": (action: ISendAudiencesAction) => Promise<void>;
  "list-pattern": (action: IListPatternAction) => Promise<void>;
  accept: (action: IAcceptAction) => Promise<void>;
  list: (action: IListAction) => Promise<void>;
  prepare: (action: IPrepareAction) => Promise<void>;
  request: (action: IRequestAction) => Promise<void>;
  route: (action: IRouteAction) => Promise<void>;
}

export interface IRetryableAction {
  retryCount?: number;
}

export interface IAction extends IRetryableAction {
  command: Command;
  dryRunKey: string;
  requestId: string;
  tenantId: string;
  shouldVerifyRequestTranslation?: boolean;
  translated?: boolean;
  shouldUseInboundSegmentEventKinesis?: boolean;
}

export interface IRequestAction extends IAction {
  apiVersion: ApiVersion;
  dryRunKey: TenantRouting;
  command: "request";
  requestFilePath: string;
  scope: TenantScope;
  source: string;
  shouldVerifyRequestTranslation?: boolean;
  translated?: boolean;
}

export interface ISequenceAction extends IAction {
  command: "sequence";
  sequenceId: string;
  sequenceActionId: string;
  tenantId: string;
}

export interface IAcceptAction extends IAction {
  command: "accept";
  shouldVerifyRequestTranslation?: boolean;
  translated?: boolean;
}

export interface IListAction extends IAction {
  command: "list";
  exclusiveStartKey?: DocumentClient.Key;
}

export interface ISendAudiencesAction extends IAction {
  audienceId: string;
  command: "send-audiences";
  cursor?: string;
}

export interface ISendAudiencesMemberAction extends IAction {
  command: "send-audiences-member";
  memberId: string;
}

export interface IListPatternAction extends IAction {
  command: "list-pattern";
  exclusiveStartKey?: DocumentClient.Key;
}

export interface IAdHocListAction extends IAction {
  command: "ad-hoc-list";
}

export interface IPrepareAction extends IAction {
  command: "prepare";
  messageId: string;
  messageFilePath: string;
  scheduleJobId?: string;
  shouldVerifyRequestTranslation?: boolean;
  translated?: boolean;
}

export interface IRouteAction extends IAction {
  command: "route";
  contextFilePath: string;
  messageId: string;
  messageFilePath?: string;
  times?: SendTimes;
  failedAddress?: RouteNodeAddress;
  shouldVerifyRequestTranslation?: boolean;
  translated?: boolean;
}

export interface IActionRecord extends Kinesis.Types.PutRecordInput {
  Data: IAction;
  PartitionKey: string; // generatePartition(requestId | messageId | actionId) ->
  StreamName: string;
}

export interface IRenderRecord extends Kinesis.Types.PutRecordInput {
  Data: IRenderProviderPayload;
  PartitionKey: string; // generatePartition(requestId | messageId | actionId) ->
  StreamName: string;
}

export interface ISendRecord extends Kinesis.Types.PutRecordInput {
  Data: ISendProviderPayload;
  PartitionKey: string; // generatePartition(requestId | messageId | actionId) ->
  StreamName: string;
}

export interface ISequenceRecord extends Kinesis.Types.PutRecordInput {
  Data: ISequenceAction;
  PartitionKey: string;
  StreamName: string;
}

export type ActionService = (tenantId: string) => {
  emit: <T extends IAction>(action: T) => Promise<void>;
  emitActions: <T extends IAction>(actions: T[]) => Promise<void>;
};

export type RenderService = (tenantId: string) => {
  emit: (payload: IRenderProviderPayload) => Promise<void>;
};

export type RequestService = (tenantId: string) => {
  create: (payload: IRequest) => Promise<{ filePath: string }>;
};
export type MessageService = (tenantId: string) => {
  create: (payload: {
    message: IMessage;
    shouldVerifyRequestTranslation?: boolean;
    translated?: boolean;
  }) => Promise<{ filePath: string; message: IMessage }>;
  get: (payload: { filePath: string }) => Promise<IMessage | undefined | null>;
};

export type SendService = (tenantId: string) => {
  emit: (payload: ISendProviderPayload) => Promise<void>;
};

export type ContextService = (tenantId: string) => {
  create: (payload: {
    context: ISendMessageContext;
    messageId: string;
  }) => Promise<{ filePath: string }>;
  get: (payload: { filePath: string }) => Promise<ISendMessageContext>;
};

export type OutputService = (tenantId: string) => {
  create: (requestId: string, context: ISendMessageContext) => Promise<void>;
  get: (requestId: string, messageId: string) => Promise<ISendMessageContext>;
};

// tslint:disable-next-line: no-empty-interface
export interface IProviderConfiguration extends IConfiguration {}

export interface IBrandContext extends IBrand {
  partials?: {
    [snippetName: string]: string;
  };
  locales?: {
    [key: string]: IBrand;
  };
}

export interface IMessageBrands {
  /** Can be default brand, message.brand_id, or undefined if the notification specified brand disabled */
  main?: IBrandContext;
  /** brands of message.channels[channel].brand_id */
  channels?: {
    [channelName: string]: IBrandContext;
  };
}

export type AdHocListMessageRecipient = Recipient & { ad_hoc_list_id: string };
export interface ISendMessageContext {
  category?: NotificationCategory;
  content: Content | INotificationWire;
  channels?: MessageChannels;
  overrides?: {
    channels?: Record<string, any>;
    providers?: Record<string, any>;
    brand?: {
      snippets?: IBrandSnippets;
      settings?: {
        colors?: IBrandColors;
        email?: IBrandSettingsEmail;
      };
    };
  };
  data?: MessageData; // Should this be here or in variableData? Probably not both as it is now.
  dryRunKey?: TenantRouting;
  environment: "production" | "test";
  metadata?: MessageMetadata;
  preferences?: IProfilePreferences;
  profile: IProfile; // Should this be here or in variableData? Probably not both as it is now.
  providers: IProviderConfiguration[];
  routingTree?: RouteNode;
  timeouts?: RouteTimeoutTable;
  scope: string;
  tenant: ITenant;
  /** Note: Only available to v2 pipeline. We should add snake_case aliases for these values */
  variableData: {
    data?: MessageData;
    courier: CourierRenderOverrides;
    messageId: string;
    event?: string; // In v1 this is templateId, V2 message.metadata.event ?? message.template
    template?: string; // V2 send specified template
    profile: IProfile;
    recipient?: string; // Alias for user_id for v1 back compat
    openTrackingId?: string;
    unsubscribeTrackingId?: string;
    urls?: {
      opened: string | null;
      unsubscribe: string | null;
      preferences?: string | null;
    };
    utmMap?: UTMMap;
  };
  brands: IMessageBrands;
}

export interface IRenderedOutput {
  deliveryHandlerParams: DeliveryHandlerParams;
  renderedTemplates: IRenderedTemplatesMap;
  pricingPlan?: PricingPlan;

  // Duplicated data from ISendMessage context to reduce latency. TODO: Remove tree
  tree?: RouteNode;
  timeouts?: RouteTimeoutTable;
}

export type PublishedState = "published" | "draft" | "submitted";

export type Environment = "production" | "test";
