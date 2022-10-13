import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { list as listTemplates } from "~/lib/notification-service";
import Strategy, { ITenantMetricCollection } from "./strategy";

import { CourierObject, INotificationJsonWire, ITenant } from "~/types.api";

let templates: Array<CourierObject<INotificationJsonWire>> = [];

const getTemplates = async (tenantId: string) => {
  let lastKey: DocumentClient.Key;
  let results = [];

  do {
    const { objects, lastEvaluatedKey } = await listTemplates({
      archived: false,
      exclusiveStartKey: lastKey,
      tenantId,
    });
    if (objects?.length) {
      results = results.concat(objects);
    }
    lastKey = lastEvaluatedKey;
  } while (lastKey);

  templates = results;
};

const getTemplatesCount = () => {
  return { template_count: templates.length };
};

const getTemplatesLastCreated = () => {
  templates.sort((a, b) =>
    new Date(a.created) > new Date(b.created) ? 1 : -1
  );

  const lastCreated = templates.length > 0 ? templates[0].created : undefined;

  return { template_last_created: lastCreated };
};

const getTemplatesLastUpdated = () => {
  templates.sort((a, b) =>
    new Date(a.updated) > new Date(b.updated) ? 1 : -1
  );

  const lastUpdated = templates.length > 0 ? templates[0].updated : undefined;

  return { template_last_updated: lastUpdated };
};

export default class Templates extends Strategy {
  constructor() {
    super("templates");
  }

  public async collect(tenant: ITenant) {
    const { tenantId } = tenant;

    await getTemplates(tenantId);

    const metrics: ITenantMetricCollection[] = [
      getTemplatesCount(),
      getTemplatesLastCreated(),
      getTemplatesLastUpdated(),
    ];
    return metrics;
  }
}
