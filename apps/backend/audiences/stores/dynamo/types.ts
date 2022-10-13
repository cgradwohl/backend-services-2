import { Operator } from "~/audiences/lib/audience-rule-engine";
export interface IDDBAudienceKeys {
  gsi1pk: string;
  pk: string;
  shardId?: number;
  gsi2pk?: string;
}

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

interface BaseFilterConfig {
  operator: Operator;
}

export interface SingleFilterConfig extends BaseFilterConfig {
  path: string;
  value: string | boolean;
}

interface NestedFilterConfig extends BaseFilterConfig {
  filters: FilterConfig[];
}

export type FilterConfig = XOR<SingleFilterConfig, NestedFilterConfig>;

export interface IDDBAudience extends IDDBAudienceKeys {
  audienceId: string;
  createdAt: string;
  description?: string;
  lastSendAt?: string;
  memberCount?: number;
  name?: string;
  updatedAt: string;
  version: number;
  filter: FilterConfig;
  workspaceId: string;
}

export interface IDDBAudienceMember extends IDDBAudienceKeys {
  addedAt: string;
  audienceId: string;
  audienceVersion: number;
  userId: string;
  reason: string;
  workspaceId: string;
}

export interface IDDBAudienceCalculation extends IDDBAudienceKeys {
  audienceId: string;
  lastUpdatedAt: string;
  result: "calculating" | "calculated" | "error";
  totalUsers: number;
  totalUsersFiltered: number;
  userCount: number;
  workspaceId: string;
}
