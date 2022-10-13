import { ArgumentRequiredError } from "../errors";
import { SendDataEntity } from "../types";
import { IMessageItem, IMessageItemKey } from "./message.types";

type MessageConstructorItem = Omit<IMessageItem, "created" | "updated">;

export class Message implements IMessageItem {
  created!: string;
  filePath!: string;
  messageId!: string;
  jobId: string | undefined;
  requestId!: string;
  sequenceId: string | undefined;
  sequenceActionId: string | undefined;
  triggerId: string | undefined;
  triggerEventId: string | undefined;
  updated!: string;
  workspaceId!: string;

  constructor({
    filePath,
    messageId,
    jobId,
    requestId,
    sequenceId,
    sequenceActionId,
    triggerId,
    triggerEventId,
    workspaceId,
  }: MessageConstructorItem) {
    const message: IMessageItem = {
      created: new Date().toISOString(),
      filePath,
      messageId,
      jobId,
      requestId,
      sequenceId,
      sequenceActionId,
      triggerId,
      triggerEventId,
      updated: new Date().toISOString(),
      workspaceId,
    };
    this.validate(message);
    Object.assign(this, message);
  }

  public toItem(): IMessageItem & IMessageItemKey {
    return {
      ...this,
      ...this.key(),
      ___type___: SendDataEntity.message,
    };
  }

  public key(): IMessageItemKey {
    return {
      pk: `request/${this.requestId}`,
      sk: `message/${this.messageId}`,
      gsi1pk: `message/${this.messageId}`,
      gsi1sk: `message/${this.messageId}`,
    };
  }

  protected validate(item: IMessageItem) {
    const { workspaceId, requestId, messageId, filePath } = item;

    if (!workspaceId) {
      throw new ArgumentRequiredError("workspaceId is required.");
    }
    if (!requestId) {
      throw new ArgumentRequiredError("requestId is required.");
    }
    if (!messageId) {
      throw new ArgumentRequiredError("messageId is required.");
    }
    if (!filePath) {
      throw new ArgumentRequiredError("filePath is required.");
    }
  }
}

export { IMessageItem };
