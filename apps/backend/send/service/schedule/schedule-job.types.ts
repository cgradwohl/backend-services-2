import { SendDyanmoItem } from "../data/types";

export interface IScheduleJobItem extends SendDyanmoItem {
  expiration: number;
  messageId: string;
  messageFilePath: string;
  requestId: string;
  scheduleJobId: string;
}

type scheduleJobId = string;
export interface IScheduleJobItemKey {
  pk: `scheduleJob/${scheduleJobId}`;
  sk: `scheduleJob/${scheduleJobId}`;
}

export type ScheduleJobConstructorItem = Omit<
  IScheduleJobItem,
  "created" | "scheduleJobId" | "updated"
> & { created?: string; scheduleJobId?: string; updated?: string };
