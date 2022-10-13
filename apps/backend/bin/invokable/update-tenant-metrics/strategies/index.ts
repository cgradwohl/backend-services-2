import subDays from "date-fns/subDays";
import { mergeObjects } from "json-merger";

import log from "~/lib/log";
import { get as getTenant } from "~/lib/tenant-service";

import BrandsStrategy from "./brands";
import IntegrationsStrategy from "./integrations";
import ListsStrategy from "./lists";
import TemplatesStrategy from "./templates";

import Strategy, { ITenantMetricCollection } from "./strategy";

class StrategyManager {
  private strategies: Strategy[];

  constructor() {
    this.strategies = [
      new BrandsStrategy(),
      new IntegrationsStrategy(),
      new ListsStrategy(),
      new TemplatesStrategy(),
    ];
  }

  public async collect(
    tenantId: string
  ): Promise<ITenantMetricCollection | ITenantMetricCollection[]> {
    const tenant = await getTenant(tenantId);
    log(`tenant (${tenantId}) fetched`);

    const now = Date.now();
    const start = subDays(now, 90).getTime();
    const end = now;

    let metrics: ITenantMetricCollection = {};

    for (const strategy of this.strategies) {
      const collected = await strategy.collect(tenant);

      if (Array.isArray(collected)) {
        collected.map((metric) => {
          metrics = mergeObjects([metrics, metric]);
        });
      } else if (Object.keys(collected).length === 0) {
        continue;
      } else {
        metrics = mergeObjects([metrics, collected]);
      }
    }

    return metrics;
  }
}

export default new StrategyManager();
