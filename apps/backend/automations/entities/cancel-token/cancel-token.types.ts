import { AutomationDynamoItem } from "../types";

export interface IAutomationCancelTokenItem extends AutomationDynamoItem {
  runId: string;
  token: string;
}

export type AutomationCancelTokenConstructorItem = Omit<
  IAutomationCancelTokenItem,
  "created" | "updated" | "___type___"
> & { created?: string; shard?: number; updated?: string };

type runId = string;
type token = string;
export interface IAutomationCancelTokenItemKey {
  pk: `${token}`;
  sk: `${token}/${runId}`;
}
