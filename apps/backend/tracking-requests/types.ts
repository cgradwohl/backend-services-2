import { AdhocAutomation } from "~/automations/types";
import { IProfile } from "~/types.api";
import { TenantRouting, TenantScope } from "~/types.internal";

// can be a template or ad hoc automation
export interface ITrackingRequest {
  automation?: AdhocAutomation;
  brand?: string;
  created: string;
  data?: any;
  event: string;
  override?: any;
  profile?: IProfile;
  dryRunKey?: TenantRouting;
  scope: TenantScope;
  tenantId: string;
  trackingId: string;
  user: string;
}

export type NewTrackingRequest = Omit<
  ITrackingRequest,
  "created" | "scope" | "tenantId" | "trackingId" | "dryRunKey"
>;
