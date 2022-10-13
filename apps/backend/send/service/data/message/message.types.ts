import { SendDyanmoItem } from "../types";

type requestId = string;
type messageId = string;

export interface IMessageItemKey {
  pk: `request/${requestId}`;
  sk: `message/${messageId}`;
  gsi1pk: `message/${messageId}`;
  gsi1sk: `message/${messageId}`;
}
export interface IMessageItem extends SendDyanmoItem {
  messageId: string;
  filePath: string;
  jobId: string | undefined;
  requestId: string;
  sequenceId: string | undefined;
  sequenceActionId: string | undefined;
  triggerId: string | undefined;
  triggerEventId: string | undefined;
}
