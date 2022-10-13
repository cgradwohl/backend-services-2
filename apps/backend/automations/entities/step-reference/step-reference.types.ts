import { AutomationDynamoItem } from "../types";

export interface IAutomationStepReferenceItem extends AutomationDynamoItem {
  runId: string;
  stepId: string;
  name: string;
}

export type AutomationStepReferenceConstructorItem = Omit<
  IAutomationStepReferenceItem,
  "created" | "updated" | "___type___"
> & { created?: string; updated?: string };

type name = string;
type runId = string;
export interface IAutomationStepReferenceItemKey {
  pk: `${runId}/${name}`;
  sk: `${runId}/${name}`;
}
