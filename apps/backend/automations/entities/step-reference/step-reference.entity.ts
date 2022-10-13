import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
  ArgumentRequiredError,
  AutomationEntity,
  InvalidAutomationEntityError,
} from "../types";
import {
  AutomationStepReferenceConstructorItem,
  IAutomationStepReferenceItem,
  IAutomationStepReferenceItemKey,
} from "./step-reference.types";

export class AutomationStepReference implements IAutomationStepReferenceItem {
  created: string;
  name: string;
  runId: string;
  stepId: string;
  tenantId: string;
  updated: string;
  ___type___: AutomationEntity.Ref;

  constructor({
    created,
    name,
    runId,
    stepId,
    tenantId,
    updated,
  }: AutomationStepReferenceConstructorItem) {
    const ref: IAutomationStepReferenceItem = {
      created: created ?? new Date().toISOString(),
      name,
      runId,
      stepId,
      tenantId,
      updated: updated ?? new Date().toISOString(),
      ___type___: AutomationEntity.Ref,
    };
    this.validate(ref);
    Object.assign(this, ref);
  }

  public static fromItem(
    Item: DocumentClient.AttributeMap
  ): AutomationStepReference {
    const { created, name, runId, stepId, tenantId, updated } = Item;
    if (!created) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'created'."
      );
    }

    if (!name) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'name'."
      );
    }

    if (!updated) {
      throw new InvalidAutomationEntityError(
        "The Dynamo Item is missing the required property: 'updated'."
      );
    }

    return new AutomationStepReference({
      created,
      name,
      runId,
      stepId,
      tenantId,
      updated,
    });
  }

  public toItem(): IAutomationStepReferenceItem &
    IAutomationStepReferenceItemKey {
    return {
      ...this,
      ...AutomationStepReference.key({
        name: this.name,
        runId: this.runId,
      }),
    };
  }

  public static key(params: {
    name: string;
    runId: string;
  }): IAutomationStepReferenceItemKey {
    const { name, runId } = params;
    return {
      pk: `${runId}/${name}`,
      sk: `${runId}/${name}`,
    };
  }

  protected validate(item: IAutomationStepReferenceItem) {
    const { runId, stepId, tenantId } = item;

    if (!runId) {
      throw new ArgumentRequiredError("runId is required.");
    }
    if (!stepId) {
      throw new ArgumentRequiredError("stepId is required.");
    }
    if (!tenantId) {
      throw new ArgumentRequiredError("tenantId is required.");
    }
  }
}
