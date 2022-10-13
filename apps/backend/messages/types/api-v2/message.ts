// tslint:disable: object-literal-sort-keys
interface IMessage {
  created: number;
  messageId: string;
  requestId: string;
  workspaceId: string;
}

interface IMessageItem extends IMessage {
  pk: string;
  gsi2pk: string;
  gsi3pk: string;
  gsi3sk: number;
}

class MessageItem implements IMessage {
  public readonly created: number;
  public messageId: string;
  public requestId: string;
  public workspaceId: string;

  constructor(payload: IMessage) {
    this.validate(payload);
    Object.assign(this, payload);
  }

  public toItem(shard: number): IMessageItem {
    return {
      created: this.created,
      messageId: this.messageId,
      requestId: this.requestId,
      workspaceId: this.workspaceId,
      ...this.key(shard),
    };
  }

  private key(shard: number) {
    return {
      pk: `${this.workspaceId}/${this.messageId}`,
      gsi2pk: this.requestId,
      gsi3pk: `${this.workspaceId}/${shard}`,
      gsi3sk: this.created,
    };
  }

  private validate(payload: IMessage) {
    const { messageId, requestId, workspaceId } = payload;

    if (!messageId) {
      throw new Error("Invalid OverflowMessage. 'messageId' required.");
    }

    if (!requestId) {
      throw new Error("Invalid OverflowMessage. 'requestId' required.");
    }

    if (!workspaceId) {
      throw new Error("Invalid OverflowMessage. 'workspaceId' required.");
    }
  }
}
