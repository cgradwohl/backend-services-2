import { SendSequenceAction, Sequence } from "~/api/send/types";
import { SendDyanmoItem } from "../types";

type requestId = string;
type sequenceId = string;
type sequenceActionId = string;

export interface ISequenceActionItemKey {
  pk: `request/${requestId}`;
  sk: `sequenceAction/${sequenceActionId}`;
  gsi1pk: `sequence/${sequenceId}`;
  gsi1sk: `sequenceAction/${sequenceActionId}`;
  gsi2pk: `sequenceAction/${sequenceActionId}`;
  gsi2sk: `sequenceAction/${sequenceActionId}`;
}

export interface ISequenceActionItem extends SendDyanmoItem {
  filePath: string; // points to sequence payload in S3
  requestId: string;
  sequenceId: string;
  sequenceActionId: string;
  nextSequenceActionId: string | undefined;
  prevSequenceActionId: string | undefined;
  triggerId: string | undefined;
}

export type SequenceActionCreateItem = Omit<
  ISequenceActionItem,
  | "created"
  | "filePath"
  | "nextSequenceActionId"
  | "prevSequenceActionId"
  | "sequenceActionId"
  | "updated"
  | "workspaceId"
> & { sequence: Sequence };

export type SequenceActionPayload = ISequenceActionItem & SendSequenceAction;
