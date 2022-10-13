import { S3ObjectPath, TenantRouting } from "~/types.internal";
import { AutomationDynamoItem } from "../types";
export interface IAutomationRunItem extends AutomationDynamoItem {
  cancelationToken: string;
  context: S3ObjectPath;
  dryRunKey?: TenantRouting;
  runId: string;
  scope: string;
  source: string[];
  status: string;
  shard: number;
}

export type AutomationRunConstructorItem = Omit<
  IAutomationRunItem,
  "created" | "shard" | "updated" | "___type___"
> & { created?: string; shard?: number; updated?: string };

type runId = string;
export interface IAutomationRunItemKey {
  pk: `${runId}`;
  sk: `${runId}`;
}
