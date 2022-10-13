import { IGetFn, IRemoveFn } from "../dynamo/object-service/types";

export interface IRateLimit {
  points: number;
  expires?: number;
}

export type RateLimitType =
  | "bulk-invites"
  | "invites"
  | "objects"
  | "onboarding/info"
  | "login"
  | "login/verify"
  | "tenant/request";

export interface IRateLimitsService {
  get: IGetFn<IRateLimit>;
  remove: IRemoveFn<IRateLimit>;
  upsert: (
    params: { id: string; tenantId: string; userId: string },
    object: { points: number; newExpire: number; forceExpire: boolean }
  ) => Promise<IRateLimit>;
}
