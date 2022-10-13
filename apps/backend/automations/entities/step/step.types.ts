import { AutomationDynamoItem } from "../types";

export enum StepAction {
  Cancel = "cancel",
  Delay = "delay",
  FetchData = "fetch-data",
  Subscribe = "subscribe",
  Invoke = "invoke",
  Send = "send",
  SendList = "send-list",
  UpdateProfile = "update-profile",
}
export enum StepStatus {
  Processed = "PROCESSED",
  Error = "ERROR",
  Skipped = "SKIPPED",
  Processing = "PROCESSING",
  NotProcessed = "NOT PROCESSED",
  Waiting = "WAITING",
}

// Step Context is for internal use, and describe information
// about the steps execution. We surface this information to
// end users via Automation Data Logs.
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

export interface IAutomationStepItem extends AutomationDynamoItem {
  action: StepAction;
  context?: StepContext;
  if?: string;
  ref?: string;
  nextStepId?: string;
  prevStepId?: string;
  runId: string;
  shard: number;
  stepId: string;
  status: StepStatus;
}

export type AutomationStepConstructorItem = Omit<
  IAutomationStepItem,
  "created" | "shard" | "updated" | "___type___"
> & { created?: string; shard?: number; updated?: string };

type runId = string;
type stepId = string;
export interface IAutomationStepItemKey {
  pk: `${runId}`;
  sk: `${runId}/step/${stepId}`;
}
