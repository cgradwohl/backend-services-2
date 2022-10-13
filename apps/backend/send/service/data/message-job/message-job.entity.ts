import { nanoid } from "nanoid";
import { ArgumentRequiredError } from "../errors";
import { IMessageJobItem, IMessageJobItemKey } from "./message-job.types";

type MessageJobConstructorItem = Omit<
  IMessageJobItem,
  "created" | "messageJobId" | "updated"
>;

// TODO: Added assertions to potentially not initialized props
export class MessageJob implements IMessageJobItem {
  created!: string;
  messageId!: string;
  messageJobId!: string;
  filePath!: string;
  requestId!: string;
  sequenceId: string | undefined;
  sequenceActionId: string | undefined;
  triggerId: string | undefined;
  triggerEventId: string | undefined;
  updated!: string;
  workspaceId!: string;

  constructor({
    messageId,
    filePath,
    requestId,
    sequenceId,
    sequenceActionId,
    triggerId,
    triggerEventId,
    workspaceId,
  }: MessageJobConstructorItem) {
    const job: IMessageJobItem = {
      created: new Date().toISOString(),
      messageId,
      messageJobId: nanoid(),
      filePath,
      requestId,
      sequenceId,
      sequenceActionId,
      triggerId,
      triggerEventId,
      updated: new Date().toISOString(),
      workspaceId,
    };
    this.validate(job);
    Object.assign(this, job);
  }

  public toItem(): IMessageJobItem & IMessageJobItemKey {
    return {
      ...this,
      ...this.key(),
    };
  }

  public key(): IMessageJobItemKey {
    return {
      pk: `request/${this.requestId}`,
      sk: `messageJob/${this.messageJobId}`,
      gsi1pk: `message/${this.messageId}`,
      gsi1sk: `messageJob/${this.messageJobId}`,
      gsi2pk: `messageJob/${this.messageJobId}`,
      gsi2sk: `messageJob/${this.messageJobId}`,
    };
  }

  protected validate(item: IMessageJobItem) {
    const { workspaceId, requestId, messageId, messageJobId, filePath } = item;

    if (!workspaceId) {
      throw new ArgumentRequiredError("workspaceId is required.");
    }
    if (!requestId) {
      throw new ArgumentRequiredError("requestId is required.");
    }
    if (!messageId) {
      throw new ArgumentRequiredError("messageId is required.");
    }
    if (!messageJobId) {
      throw new ArgumentRequiredError("messageJobId is required.");
    }
    if (!filePath) {
      throw new ArgumentRequiredError("filePath is required.");
    }
  }
}
