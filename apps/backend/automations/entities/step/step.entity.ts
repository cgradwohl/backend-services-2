import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getHashFromRange } from "~/lib/get-hash-from-range";
import {
  ArgumentRequiredError,
  AutomationEntity,
  InvalidAutomationEntityError,
} from "../types";
import {
  AutomationStepConstructorItem,
  IAutomationStepItem,
  IAutomationStepItemKey,
  StepAction,
  StepContext,
  StepStatus,
} from "./step.types";

// -  - - - - - - - - - - - - - - - --  - - - - - - - - - - - - - - - --  - - - -
const PARTITION_SHARD_RANGE = 10;
/**
 * This implementation of AutomationStep is only concerned with
 * interfacing with dynamodb.
 *
 * TODO: refactor this class to return specific step instance based
 * on action type.
 */
export class AutomationStep implements IAutomationStepItem {
  action: StepAction;
  created: string;
  context?: StepContext;
  if?: string;
  ref?: string;
  nextStepId?: string;
  prevStepId?: string;
  runId: string;
  shard: number;
  stepId: string;
  status: StepStatus;
  tenantId: string;
  updated: string;
  ___type___: AutomationEntity.Step;

  constructor({
    created,
    action,
    context,
    if: conditional,
    ref,
    nextStepId,
    prevStepId,
    runId,
    shard,
    stepId,
    status,
    tenantId,
    updated,
  }: AutomationStepConstructorItem) {
    const step: IAutomationStepItem = {
      created: created ?? new Date().toISOString(),
      action,
      context,
      if: conditional,
      ref,
      nextStepId,
      prevStepId,
      runId,
      shard: shard ?? getHashFromRange(PARTITION_SHARD_RANGE),
      stepId,
      status,
      tenantId,
      updated: updated ?? new Date().toISOString(),
      ___type___: AutomationEntity.Step,
    };
    this.validate(step);
    Object.assign(this, step);
  }

  public static fromItem(Item: DocumentClient.AttributeMap): AutomationStep {
    const {
      created,
      action,
      context,
      if: conditional,
      ref,
      nextStepId,
      prevStepId,
      runId,
      shard,
      stepId,
      status,
      tenantId,
      updated,
    } = Item;

    if (!created) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'created'."
      );
    }

    if (!shard) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'shard'."
      );
    }

    if (!updated) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'updated'."
      );
    }

    return new AutomationStep({
      created,
      action,
      context,
      if: conditional,
      ref,
      nextStepId,
      prevStepId,
      runId,
      shard,
      stepId,
      status,
      tenantId,
      updated,
    });
  }

  public toItem(): IAutomationStepItem & IAutomationStepItemKey {
    return {
      ...this,
      ...AutomationStep.key({
        runId: this.runId,
        stepId: this.stepId,
      }),
    };
  }

  public static key(params: {
    runId: string;
    stepId: string;
  }): IAutomationStepItemKey {
    const { runId, stepId } = params;
    return {
      pk: `${runId}`,
      sk: `${runId}/step/${stepId}`,
    };
  }

  protected validate(item: IAutomationStepItem) {
    const { runId, shard, stepId, tenantId } = item;

    if (!runId) {
      throw new ArgumentRequiredError("runId is required.");
    }
    if (!shard) {
      throw new ArgumentRequiredError("shard is required.");
    }
    if (!stepId) {
      throw new ArgumentRequiredError("stepId is required.");
    }
    if (!tenantId) {
      throw new ArgumentRequiredError("tenantId is required.");
    }
  }
}
