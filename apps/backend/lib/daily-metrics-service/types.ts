export type MetricIncrement = string | [string, number];

export type IncrementMetrics = (
  tenantId: string,
  timestamp: Date | number,
  ...metrics: MetricIncrement[]
) => Promise<void>;

export interface IDailyMetricsKey {
  day?: string;
  tenantId: string;
}

export interface IDailyMetricsDynamo extends IDailyMetricsKey {
  day: string;
  [key: string]: any; // necessary because typescript can't separate the above types
}

export interface IDailyMetrics extends IDailyMetricsKey {
  day: string;
  metrics: {
    [key: string]: number;
  };
}
