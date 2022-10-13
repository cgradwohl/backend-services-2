import { Sequence } from "~/api/send/types";
import { SendDyanmoItem } from "../types";

type requestId = string;
type sequenceId = string;

export interface ISequenceItemKey {
  pk: `request/${requestId}`;
  sk: `sequence/${sequenceId}`;
  gsi1pk: `sequence/${sequenceId}`;
  gsi1sk: `sequence/${sequenceId}`;
}

export interface ISequenceItem extends SendDyanmoItem {
  filePath: string; // points to sequence payload in S3
  parentSequenceId: string | undefined; // points to its parents sequence if it exists
  requestId: string;
  sequenceId: string;
  triggerId: string | undefined;
}

export type SequenceCreateItem = Omit<
  ISequenceItem,
  "created" | "filePath" | "sequenceId" | "updated" | "workspaceId"
> & { sequence: Sequence };

export type SequencePayload = ISequenceItem & {
  payload: Sequence;
};
