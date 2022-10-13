export type FilePathGenerator = (params: {
  id: string;
  name: SendDataEntity;
}) => `${string}/${string}_${string}.json`;

export interface SendDyanmoItem {
  created: string;
  updated: string;
  workspaceId: string;
}

export enum SendDataEntity {
  message = "message",
  request = "request",
  sequence = "sequence",
  sequenceAction = "sequence-action",
  scheduleJob = "schedule-job",
}
