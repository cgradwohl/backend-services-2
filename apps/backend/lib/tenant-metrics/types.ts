import { DocumentClient } from "aws-sdk/clients/dynamodb";

export type BuildTenantMetricFn = (
  metric: string,
  operator: "INCREMENT" | "SET",
  value?: number
) => ITenantMetricOperation;

export interface ITenantMetricOperation {
  metric: string;
  operator: "INCREMENT" | "SET";
  value: number;
}

interface IUpdateTenantMetricParams {
  operation: ITenantMetricOperation;
  tenantId: string;
}

interface IUpdateTenantMetricsParams {
  operations: ITenantMetricOperation[];
  tenantId: string;
}

export type TrackTenantMetricFn = (
  operations: ITenantMetricOperation,
  tenantId: string
) => Promise<void>;

export type TrackTenantMetricsFn = (
  operations: ITenantMetricOperation[],
  tenantId: string
) => Promise<void>;

export type UpdateTenantMetricsFn = (
  params: IUpdateTenantMetricsParams
) => Promise<void>;
