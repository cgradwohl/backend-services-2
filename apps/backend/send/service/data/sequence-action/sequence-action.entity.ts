import { ArgumentRequiredError } from "../errors";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
  ISequenceActionItem,
  ISequenceActionItemKey,
} from "./sequence-action.types";
import { SendDataEntity } from "../types";

export type SequenceActionConstructorItem = Omit<
  ISequenceActionItem,
  "created" | "updated"
>;

export class SequenceAction implements ISequenceActionItem {
  created: string;
  filePath: string;
  requestId: string;
  nextSequenceActionId: string | undefined;
  prevSequenceActionId: string | undefined;
  sequenceId: string;
  sequenceActionId: string;
  triggerId: string | undefined;
  updated: string;
  workspaceId: string;

  constructor({
    filePath,
    requestId,
    sequenceId,
    sequenceActionId,
    nextSequenceActionId,
    prevSequenceActionId,
    triggerId,
    workspaceId,
  }: SequenceActionConstructorItem) {
    const sequenceAction: ISequenceActionItem = {
      created: new Date().toISOString(),
      filePath,
      requestId,
      sequenceId,
      sequenceActionId,
      nextSequenceActionId,
      prevSequenceActionId,
      triggerId,
      updated: new Date().toISOString(),
      workspaceId,
    };
    this.validate(sequenceAction);
    Object.assign(this, sequenceAction);
  }

  public toItem(): ISequenceActionItem & ISequenceActionItemKey {
    return {
      ...this,
      ...SequenceAction.key({
        requestId: this.requestId,
        sequenceId: this.sequenceId,
        sequenceActionId: this.sequenceActionId,
      }),
      ___type___: SendDataEntity.sequenceAction,
    };
  }

  public static fromItem(Item: DocumentClient.AttributeMap): SequenceAction {
    const {
      filePath,
      nextSequenceActionId,
      prevSequenceActionId,
      requestId,
      sequenceId,
      sequenceActionId,
      triggerId,
      workspaceId,
    } = Item;
    return new SequenceAction({
      filePath,
      nextSequenceActionId,
      prevSequenceActionId,
      requestId,
      sequenceId,
      sequenceActionId,
      triggerId,
      workspaceId,
    });
  }

  public static key(params: {
    requestId: string;
    sequenceId: string;
    sequenceActionId: string;
  }): ISequenceActionItemKey {
    const { requestId, sequenceId, sequenceActionId } = params;
    return {
      pk: `request/${requestId}`,
      sk: `sequenceAction/${sequenceActionId}`,
      gsi1pk: `sequence/${sequenceId}`,
      gsi1sk: `sequenceAction/${sequenceActionId}`,
      gsi2pk: `sequenceAction/${sequenceActionId}`,
      gsi2sk: `sequenceAction/${sequenceActionId}`,
    };
  }

  protected validate(item: ISequenceActionItem) {
    const { workspaceId, sequenceId, sequenceActionId, requestId, filePath } =
      item;

    if (!workspaceId) {
      throw new ArgumentRequiredError("workspaceId is required.");
    }
    if (!sequenceActionId) {
      throw new ArgumentRequiredError("sequenceActionId is required.");
    }
    if (!sequenceId) {
      throw new ArgumentRequiredError("sequenceId is required.");
    }
    if (!requestId) {
      throw new ArgumentRequiredError("requestId is required.");
    }
    if (!filePath) {
      throw new ArgumentRequiredError("filePath is required.");
    }
  }
}
