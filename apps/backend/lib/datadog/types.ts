export type CreateMetricFn = (
  tenantId: string,
  metric: string,
  options: ICreateMetricOptions
) => IMetric;

export type HttpPostFn = (request: IHttpPostRequest) => Promise<void>;

export interface ICreateMetricOptions {
  interval?: number;
  tags?: string[];
  timestamp?: number;
  value?: number;
  type?: MetricType;
}

export interface IHttpPostRequest {
  series: Series;
}

export interface IMetric {
  metric: string;
  points: [[number, number]];
  tags?: string[];
  type?: MetricType;
}

export type IncrementFn = (
  tenantId: string,
  metric: string | string[],
  options?: {
    interval?: number;
    tags?: string[];
    timestamp?: number;
    value?: number;
  }
) => Promise<void>;

export type MetricHandlerFn = <T extends (...args: any[]) => ReturnType<T>>(
  fn: T
) => (...args: Parameters<T>) => ReturnType<T>;

type MetricType =
  | "count"
  | "distribution"
  | "gauge"
  | "histogram"
  | "rate"
  | "set";

export type Series = IMetric[];
