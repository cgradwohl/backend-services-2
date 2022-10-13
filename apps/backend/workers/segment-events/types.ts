import Analytics from "analytics-node";
import { IAnalyticsEventResponse } from "~/lib/segment/types";

export type AsyncTrack = (data: IAnalyticsEventResponse) => Promise<void>;

export type Group = Parameters<Analytics["group"]>[0];

export interface ITrack {
  body?: {
    [key: string]: any;
  };
  gaClientId?: string;
  key: string;
  tenantId: string;
  userId: string;
}
