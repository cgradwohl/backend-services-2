import { String } from "aws-sdk/clients/codebuild";
import { Key } from "aws-sdk/clients/dynamodb";
import { ValidateFunction } from "ajv";
import { IProfile, JSONObject } from "~/types.api";
import { TenantRouting, TenantScope } from "~/types.internal";
import {
  IApiDataSourceConfig,
  IApiWebhookConfig,
  IProfilePreferences,
  MergeStrategy,
} from "~/types.public";
import { Message } from "~/api/send/types";

// TODO: remove this as well as the class
export interface IAutomation {
  cancelation_token?: string;
  cancelationToken?: string; // NOTE: this syntax is publicly deprecated
  context: string; // s3 key
  createdAt: string;
  dryRunKey?: TenantRouting;
  runId: string;
  scope: TenantScope;
  source: string[];
  status: AutomationRunStatus;
  steps: Step[];
  tenantId: string;
  type: "automation-run";
  updatedAt?: string;
}
export interface IAutomationInvokeRequest {
  cancelation_token?: string;
  cancelationToken?: string; // NOTE: cancelationToken syntax is deprecated
  context: IAutomationRunContext;
  dryRunKey?: TenantRouting;
  runId: string;
  scope: TenantScope;
  source: string[];
  steps: any[];
}

export interface IInvocableAutomationDefinition {
  cancelation_token?: string;
  steps: Step[];
  context: IAutomationRunContext;
  dryRunKey?: TenantRouting;
  runId: string;
  scope: TenantScope;
  source: string[];
  tenantId: string;
}

// NOTE: cancelationToken syntax is deprecated
export type AdhocAutomation = Pick<
  IAutomation,
  "cancelationToken" | "cancelation_token" | "steps"
>;

export interface IAutomationDynamoItem {
  pk: string;
  sk: string;
  cancelationToken: string;
  createdAt: string;
  context: string;
  dryRunKey?: TenantRouting;
  runId: string;
  scope: string;
  source: string[];
  status: string;
  tenantId: string;
  type: string;
}

export interface IAutomationESItem {
  createdAt: string;
  runId: string;
  source: string[];
  status: string;
  tenantId: string;
  type: string;
}

// NOTE: cancelationToken syntax is deprecated
export type IngestibleAutomation = Pick<
  IAutomation,
  | "cancelationToken"
  | "cancelation_token"
  | "scope"
  | "source"
  | "steps"
  | "dryRunKey"
>;

export type StepAction =
  | "cancel"
  | "delay"
  | "fetch-data"
  | "subscribe"
  | "invoke"
  | "send"
  | "send-list"
  | "update-profile";

export interface IStep {
  action: StepAction;
  created: string;
  context?: any;
  if?: string;
  ref?: string;
  nextStepId?: string;
  prevStepId?: string;
  runId: string;
  stepId: string;
  status: AutomationStepStatus;
  tenantId: string;
  updated: string;
}
export interface ICancelStep extends IStep {
  action: "cancel";
  cancelation_token: string;
  cancelationToken?: string; // NOTE: cancelationToken syntax is deprecated
  if?: string;
  ref?: string;
}
export interface IDelayStep extends IStep {
  action: "delay";
  duration?: string;
  until?: string;
  delayFor?: string;
  delayUntil?: string;
  if?: string;
  ref?: string;
}

export interface IFetchDataStep extends IStep {
  action: "fetch-data";
  webhook: IApiWebhookConfig;
  merge_strategy: MergeStrategy;
  idempotency_key?: string; // useful for outbound mutations
  idempotency_expiry?: string;
  if?: string;
  ref?: string;
}

export interface ISubscriptionOptions {
  preferences: IProfilePreferences;
}

export interface ISubscribeStep extends IStep {
  action: "subscribe";
  list_id: string;
  recipient_id: string;
  subscription?: ISubscriptionOptions;
  if?: string;
  ref?: string;
}

export interface IDefaults {
  brand?: string;
  data?: any;
  override?: any;
  profile?: any;
  template?: string;
  recipient?: string;
  templateId?: string;
}

export type Step =
  | ICancelStep
  | IDelayStep
  | IInvokeStep
  | ISendStep
  | ISendListStep
  | IFetchDataStep
  | IUpdateProfileStep
  | ISubscribeStep;

export type IdempotentStep = Step & {
  idempotency_expiry?: string;
  idempotency_key?: string;
};

export interface ISendStepV1 extends IStep {
  action: "send";
  brand?: string;
  data?: any;
  idempotency_expiry?: string;
  idempotency_key?: string;
  override?: any;
  profile?: IProfile;
  recipient: string;
  template: string;
  if?: string;
  ref?: string;

  //TODO: TS Utility ?
  message?: never;
}

export interface ISendStepV2 extends IStep {
  action: "send";
  message: Message;

  //TODO: TS Utility ?
  brand?: never;
  data?: never;
  idempotency_expiry?: never;
  idempotency_key?: never;
  override?: never;
  if?: never;
  profile?: never;
  recipient?: never;
  template?: never;
  ref?: never;
}

export type ISendStep = ISendStepV1 | ISendStepV2;

export interface ISendListStep extends IStep {
  action: "send-list";
  brand?: string;
  data?: JSONObject;
  data_source?: IApiDataSourceConfig;
  idempotency_expiry?: string;
  idempotency_key?: string;
  override?: any;
  list: string;
  template: string; // template name that maps to a template-event
  if?: string;
  ref?: string;
}

export interface IUpdateProfileStep extends IStep {
  action: "update-profile";
  recipient_id: string;
  profile: IProfile;
  merge: MergeStrategy;
  if?: string;
  ref?: string;
}

export interface IInvokeStep extends IStep {
  action: "invoke";
  context?: IAutomationRunContext;
  template: string;
  if?: string;
  ref?: string;
}

export interface IRenderedAutomationTemplate {
  data?: object; // from track request
  profile?: object; // from track request

  // from the jsonnet template
  cancelation_token?: string; // from templates db
  cancelationToken?: string; // from templates db ... NOTE: this syntax is deprecated
  steps: Step[]; // from templates db
  sources: string[];
}

export interface IAutomationTemplateJSON {
  steps: Step[]; //NOTE: on the incoming request these are StepRequests not Step or IStep
}
export interface IAutomationTemplate {
  cancelation_token?: string;
  createdAt?: string;
  publishedAt?: string;
  publishedVersion?: string;
  updatedAt?: string;
  name: string;
  alias: string;
  tenantId: string;
  template?: string; // deprecated
  json?: IAutomationTemplateJSON;
  templateId: string;
  type: "automation-template";
}

export type TemplateAlaisType =
  | "automation-template-alias"
  | "automation-template-alias-mapping";

export interface IAutomationTemplateAlias {
  alias: string;
  templateId: string;
  tenantId: string;
  type: TemplateAlaisType;
  updated?: string;
}

export interface IAccessorProperty {
  $ref: string;
}

export interface IAutomationTemplateSource {
  tenantId: string;
  templateId: string;
  source: string; // segment event string
  createdAt?: string;
  type: "automation-source";
}

export interface IAutomationTemplatesService {
  delete: (templateId: string) => Promise<void>;
  get: (templateId: string) => Promise<IAutomationTemplate | null>;
  getByAlias: (alias: string) => Promise<IAutomationTemplate | null>;
  list: (tenantId: string) => Promise<IAutomationTemplate[]>;

  listBySource: (source: string) => Promise<IAutomationTemplate[]>;
  fetchPublishedSourcesByTemplateId: (
    templateId: string
  ) => Promise<IAutomationTemplateSource[]>;
  deleteSource: (templateId: string, source: string) => Promise<void>;
  saveSource: (
    templateId: string,
    newSource: string,
    oldSource: string
  ) => Promise<IAutomationTemplateSource>;
  publish: (templateId: string) => Promise<{
    publishedAt: string;
    publishedVersion: string;
  }>;
  render: (
    template: string,
    data?: any,
    profile?: IProfile
  ) => IRenderedAutomationTemplate;
  save: (template: IAutomationTemplate) => Promise<{
    updatedAt: string;
  }>;
  updateAlias: (alias: string, templateId: string) => Promise<string>;
  updateCancelationToken: (
    token: string,
    templateId: string
  ) => Promise<string>;
  updateName: (name: string, templateId: string) => Promise<string>;
}

export interface IAutomationTestEventsService {
  remove: (templateId: string, testEventId: String) => Promise<void>;
  save: (templateId: string, testEvent: IAutomationTestEvent) => Promise<void>;
  get: (templateId: string) => Promise<IAutomationTestEvent[]>;
}

export interface IAutomationRunsService {
  cancel: (token: string) => Promise<void>;
  create: (run: IAutomation) => Promise<void>;
  get: (runId: string) => Promise<IAutomation>;
  invoke: (request: IAutomationInvokeRequest) => Promise<void>;
  updateStatus: (runId, status: AutomationRunStatus) => Promise<void>;
  getContext: (runId: string) => Promise<IAutomationRunContext>;
  setContext: (
    runId: string,
    strategy: MergeStrategy,
    context: any
  ) => Promise<void>;
}

export type StepFactory = (tenantId: string) => {
  create: (runId: string, step: any) => Step;
};

export interface ICancelationReference {
  runId: string;
  createdAt?: string;
  tenantId: string;
  type: string;
  token: string;
  updatedAt?: string;
}
export interface ICommandParams {
  dryRunKey?: TenantRouting;
  scope?: TenantScope;
  source?: string;
}

export type Commands = {
  [key in StepAction]: (step: IStep, params?: ICommandParams) => Promise<void>;
};

export enum AutomationStepStatus {
  processed = "PROCESSED",
  error = "ERROR",
  skipped = "SKIPPED",
  processing = "PROCESSING",
  notProcessed = "NOT PROCESSED",
  waiting = "WAITING",
}

export enum AutomationRunStatus {
  canceled = "CANCELED",
  error = "ERROR",
  processed = "PROCESSED",
  processing = "PROCESSING",
  notProcessed = "NOT PROCESSED",
  waiting = "WAITING",
}
export interface IStepWorkerItem {
  dryRunKey?: TenantRouting;
  runId: string;
  scope: TenantScope;
  source: string[];
  stepId: string;
  tenantId: string;
}

export interface IDelayStepWorkerItem extends IDelayStep {
  dryRunKey?: TenantRouting;
  scope: TenantScope;
  source: string[];
  expirydate: number;
  ttl: number;
}

export interface IBackwardsCompatibleDelayStepWorkerItem extends IDelayStep {
  dryRunKey?: TenantRouting;
  scope: TenantScope;
  source: string[];
  //Legacy delay items don't have an expirydate so this type supports old plus new items
  expirydate?: number;
  ttl: number;
}

export interface IDelayStepFunctionData extends IStepWorkerItem {
  expirydate: string;
}

export interface IDelayOptions {
  dryRunKey?: TenantRouting;
  scope: TenantScope;
  source: string[];
}

export interface IAutomationDelayService {
  getDelayUnixTime: () => number;
  startDelayStepFunction: (
    expirydate: string,
    options: IDelayOptions
  ) => Promise<void>;
  enterDelayToDynamo: (options: IDelayOptions) => Promise<void>;
  enqueueDelay: (options: IDelayOptions) => Promise<void>;
}

export interface IStepContext {
  error?: {
    message: string;
  };
}

export interface IDelayContext extends IStepContext {
  expectedDelayValue?: string;
  actualDelayValue?: string;
}

interface ISendContext extends IStepContext {
  messageId: string;
}

interface ISendListContext extends IStepContext {
  messageId: string;
}

export interface IInvokeContext extends IStepContext {
  runId: string;
}

export interface ICancelContext extends IStepContext {}

export interface IFetchDataContext extends IStepContext {}

export interface IUpdateProfileContext extends IStepContext {}

export interface ISubscribeContext extends IStepContext {}

export type StepContext =
  | ISendContext
  | IDelayContext
  | ISendListContext
  | IInvokeContext
  | ICancelContext
  | IFetchDataContext
  | IUpdateProfileContext
  | ISubscribeContext;

export interface IAutomationRunContext {
  brand?: string; // notification brand
  data?: any;
  profile?: any;
  template?: string; // notification template
  recipient?: string; // notification recipient
}
export interface IAutomationTestEvent {
  id: string;
  label: string;
  // testEvent is a stringified JSON
  testEvent: string;
  testEventId: string;
  created: string;
  updated?: string;
}

export interface IStepReference {
  tenantId: string;
  runId: string;
  stepId: string;
  name: string;
}

export interface IScheduleItem {
  enabled: boolean;
  itemId?: string;
  scope: TenantScope;
  dryRunKey?: TenantRouting;
  templateId: string;
  tenantId: string;
  ttl: number;
  value: string; // either crontab string or ISO 8601 date string
}
export interface IAutomationSchedulerService {
  calculateTTL: (value: string) => number;
  deleteItem: (templateId: string, itemId: string) => Promise<void>;
  getItem: (templateId: string, itemId: string) => Promise<IScheduleItem>;
  get: (templateId: string) => Promise<IScheduleItem[]>;
  saveItem: (params: IScheduleItem) => Promise<void>;
}

export interface IAutomationSchemaConfig {
  additionalProperties: boolean;
}

export interface ISchemaValidationMethods {
  send: ValidateFunction;
  "send-list": ValidateFunction;
  delay: ValidateFunction;
  invoke: ValidateFunction;
  cancel: ValidateFunction;
  "fetch-data": ValidateFunction;
  "update-profile": ValidateFunction;
  subscribe: ValidateFunction;
  validateAllSteps: ValidateFunction;
}
