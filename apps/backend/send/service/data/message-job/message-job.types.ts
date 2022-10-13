import { SendDyanmoItem } from "../types";

type requestId = string;
type messageId = string;
type messageJobId = string;

export interface IMessageJobItemKey {
  pk: `request/${requestId}`;
  sk: `messageJob/${messageJobId}`;
  gsi1pk: `message/${messageId}`;
  gsi1sk: `messageJob/${messageJobId}`;
  gsi2pk: `messageJob/${messageJobId}`;
  gsi2sk: `messageJob/${messageJobId}`;
}
export interface IMessageJobItem extends SendDyanmoItem {
  messageId: string;
  messageJobId: string;
  filePath: string;
  requestId: string;
  sequenceId: string | undefined;
  sequenceActionId: string | undefined;
  triggerId: string | undefined;
  triggerEventId: string | undefined;
}
