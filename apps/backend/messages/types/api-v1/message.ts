import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IEventLogEntry } from "~/types.api";

export interface IMessage {
  automationRunId?: string;
  channels?: DocumentClient.DynamoDbSet;
  clicked?: number; // milli second timestamp
  configuration?: string;
  delivered?: number; // milli second timestamp
  enqueued: number; // milli second timestamp
  errorCount?: number;
  errorMessage?: string;
  eventId: string;
  jobId?: string;
  listId?: string;
  listMessageId?: string;
  logs?: IEventLogEntry[];
  messageId: string;
  messageStatus: string;
  recipientId: string;
  notificationId?: string;
  opened?: number; // milli second timestamp
  pattern?: string;
  provider?: string;
  providers?: DocumentClient.DynamoDbSet;
  readTimestamp?: number; // milli second timestamp
  recipientEmail?: string;
  requestId?: string;
  sent?: number; // milli second timestamp
  tenantId: string;
}

export interface IMessageKey {
  pk: string;
  gsi3pk: string;
  gsi3sk: string;
}

export interface IMessageByRequestIdKey {
  gsi1pk: string;
}

export type MessageItem = IMessage & IMessageKey & IMessageByRequestIdKey;

export class Message {
  protected message: IMessage;

  constructor(payload: IMessage) {
    this.validate(payload);
    this.message = payload;
  }

  public getShard(): number {
    const [, shard] = this.message?.tenantId?.match(/\/(\d)$/) ?? [];
    return shard ? parseInt(shard, 10) : null;
  }

  public toItem(shard: number): MessageItem {
    return {
      ...this.message,
      ...this.key(shard),
      ...this.byRequestIdKey(shard),
    };
  }

  public key(shard: number): IMessageKey {
    return {
      pk: `${this.message.tenantId}/${this.message.messageId}`,
      gsi3pk: `${this.message.tenantId}/${shard}`,
      gsi3sk: `${this.message.enqueued}`,
    };
  }

  // requestId can be any top-level ID that maps to N children messages
  // for instance, in the case of lists, requestId = listMessageId
  private byRequestIdKey(shard: number): IMessageByRequestIdKey {
    return this.message.requestId
      ? {
          gsi1pk: `${this.message.requestId}/${shard}`,
        }
      : undefined;
  }

  // validates the required properties exists and are of correct type
  // TODO: double-check if eventId is really necessary always
  private validate(payload: IMessage) {
    const { enqueued, eventId, messageId, messageStatus, tenantId } = payload;

    if (!enqueued) {
      throw new Error("Invalid Message. 'enqueued' required.");
    }

    if (typeof enqueued !== "number") {
      throw new Error(
        "Invalid Message. 'enqueued' must be a number (millisecond timestamp)."
      );
    }

    if (!messageId) {
      throw new Error("Invalid Message. 'messageId' required.");
    }

    if (typeof messageId !== "string") {
      throw new Error("Invalid Message. 'messageId' must be a string.");
    }

    if (!messageStatus) {
      throw new Error("Invalid Message. 'messageStatus' required.");
    }

    if (typeof messageStatus !== "string") {
      throw new Error("Invalid Message. 'messageStatus' must be a string.");
    }

    if (!tenantId) {
      throw new Error("Invalid Message. 'tenantId' required.");
    }

    if (typeof tenantId !== "string") {
      throw new Error("Invalid Message. 'tenantId' must be a string.");
    }
  }
}

export interface IPagination {
  cursor: string;
  more: boolean;
}

export interface IMessagesV3Service {
  create: (message: Message) => Promise<void>;
  get: (messageId: string) => Promise<Message>;
  setBilledUnits: (messageId: string, billedUnits: number) => Promise<void>;
  update: (
    messageId: string,
    updateQuery: Partial<DocumentClient.UpdateItemInput>
  ) => Promise<void>;
  listByRequestId: (
    requestId: string,
    cursor?: string
  ) => Promise<{ items: Message[]; paging: IPagination }>;
}

export const MessageArchiveEventDetailType = "courier.message.archive.event";

export type MessageArchiveEventDetailType = "courier.message.archive.event";

export interface IMessageArchiveEvent {
  requestId: string;
  cursor?: string;
  workspaceId: string;
}
