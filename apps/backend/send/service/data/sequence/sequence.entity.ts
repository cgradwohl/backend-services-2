import { ArgumentRequiredError } from "../errors";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ISequenceItem, ISequenceItemKey } from "./sequence.types";
import { SendDataEntity } from "../types";

export type SequenceConstructorItem = Omit<
  ISequenceItem,
  "created" | "updated"
>;

export class Sequence implements ISequenceItem {
  filePath: string;
  parentSequenceId: string | undefined;
  requestId: string;
  sequenceId: string;
  triggerId: string | undefined;
  created: string;
  updated: string;
  workspaceId: string;

  constructor({
    filePath,
    parentSequenceId,
    requestId,
    sequenceId,
    triggerId,
    workspaceId,
  }: SequenceConstructorItem) {
    const sequence: ISequenceItem = {
      created: new Date().toISOString(),
      filePath,
      parentSequenceId,
      requestId,
      sequenceId,
      triggerId,
      updated: new Date().toISOString(),
      workspaceId,
    };
    this.validate(sequence);
    Object.assign(this, sequence);
  }

  public toItem(): ISequenceItem & ISequenceItemKey {
    return {
      ...this,
      ...Sequence.key({
        requestId: this.requestId,
        sequenceId: this.sequenceId,
      }),
      ___type___: SendDataEntity.sequence,
    };
  }

  public static fromItem(Item: DocumentClient.AttributeMap): Sequence {
    const {
      filePath,
      parentSequenceId,
      requestId,
      sequenceId,
      triggerId,
      workspaceId,
    } = Item;
    return new Sequence({
      filePath,
      parentSequenceId,
      requestId,
      sequenceId,
      triggerId,
      workspaceId,
    });
  }

  public static key(params: {
    requestId: string;
    sequenceId: string;
  }): ISequenceItemKey {
    const { requestId, sequenceId } = params;
    return {
      pk: `request/${requestId}`,
      sk: `sequence/${sequenceId}`,
      gsi1pk: `sequence/${sequenceId}`,
      gsi1sk: `sequence/${sequenceId}`,
    };
  }

  protected validate(item: ISequenceItem) {
    const { workspaceId, sequenceId, requestId, filePath } = item;

    if (!workspaceId) {
      throw new ArgumentRequiredError("workspaceId is required.");
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
