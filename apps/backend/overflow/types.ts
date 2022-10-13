export interface IOverflowMessage {
  created: string;
  filePath: string;
  messageId: string;
  tenantId: string;
}

export interface IOverflowMessageItem extends IOverflowMessage {
  pk: string;
  sk: string;
}

export class OverflowMessage implements IOverflowMessage {
  public static getKey(item: IOverflowMessageItem) {
    return {
      pk: item.pk,
      sk: item.sk,
    };
  }

  public created: string;
  public filePath: string;
  public messageId: string;
  public tenantId: string;

  constructor(payload: IOverflowMessage) {
    this.validate(payload);
    Object.assign(this, payload);
  }

  public toItem(shard: number): IOverflowMessageItem {
    return {
      created: this.created,
      filePath: this.filePath,
      messageId: this.messageId,
      pk: `${this.tenantId}/${shard}`,
      sk: `${this.created}/${this.messageId}`,
      tenantId: this.tenantId,
    };
  }

  private validate(payload: IOverflowMessage) {
    const { created, filePath, messageId, tenantId } = payload;

    if (!created) {
      throw new Error("Invalid OverflowMessage. 'created' required.");
    }

    if (!filePath) {
      throw new Error("Invalid OverflowMessage. 'filePath' required.");
    }

    if (!messageId) {
      throw new Error("Invalid OverflowMessage. 'messageId' required.");
    }

    if (!tenantId) {
      throw new Error("Invalid OverflowMessage. 'tenantId' required.");
    }
  }
}
