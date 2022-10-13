import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { list as listConfigurations } from "~/lib/configurations-service";
import Strategy, { ITenantMetricCollection } from "./strategy";

import { CourierObject, IConfiguration, ITenant } from "~/types.api";

let integrations: Array<CourierObject<IConfiguration>> = [];

const getIntegrations = async (tenantId: string) => {
  let lastKey: DocumentClient.Key;
  let results = [];

  do {
    const { objects, lastEvaluatedKey } = await listConfigurations({
      archived: false,
      exclusiveStartKey: lastKey,
      tenantId,
    });
    if (objects?.length) {
      results = results.concat(objects);
    }
    lastKey = lastEvaluatedKey;
  } while (lastKey);

  integrations = results;
};

const getIntegrationsCount = () => {
  return { integration_count: integrations.length };
};

const getIntegrationsLastCreated = () => {
  integrations.sort((a, b) =>
    new Date(a.created) > new Date(b.created) ? 1 : -1
  );

  const lastCreated =
    integrations.length > 0 ? integrations[0].created : undefined;

  return { integration_last_created: lastCreated };
};

const getIntegrationsLastUpdated = () => {
  integrations.sort((a, b) =>
    new Date(a.updated) > new Date(b.updated) ? 1 : -1
  );

  const lastUpdated =
    integrations.length > 0 ? integrations[0].updated : undefined;

  return { integration_last_updated: lastUpdated };
};

export default class Integrations extends Strategy {
  constructor() {
    super("integrations");
  }

  public async collect(tenant: ITenant) {
    const { tenantId } = tenant;

    await getIntegrations(tenantId);

    const metrics: ITenantMetricCollection[] = [
      getIntegrationsCount(),
      getIntegrationsLastCreated(),
      getIntegrationsLastUpdated(),
    ];
    return metrics;
  }
}
