import { AutomationRun } from "~/automations/entities/run/run.entity";
import { AutomationEntity } from "~/automations/entities/types";
import { IAutomationDynamoItem, IAutomationESItem } from "~/automations/types";
import elasticSearch from ".";

const endpoint = process.env.ELASTIC_SEARCH_ENDPOINT;
const index =
  process.env.ELASTIC_SEARCH_AUTOMATION_RUNS_INDEX ?? "automation-runs";
const idAttribute = process.env.ELASTIC_SEARCH_ID_ATTRIBUTE ?? "runId";

export const es = elasticSearch(endpoint, index);

const put = async (item: IAutomationDynamoItem | AutomationRun) => {
  const id = item[idAttribute];

  if ((item as IAutomationDynamoItem)?.type === "automation-run") {
    const { createdAt, runId, source, status, tenantId, type } =
      item as IAutomationDynamoItem;
    const esItem: IAutomationESItem = {
      createdAt,
      runId,
      source,
      status,
      tenantId,
      type,
    };

    await es.put(id, esItem);

    return;
  }

  if ((item as AutomationRun)?.___type___ === AutomationEntity.Run) {
    const { created, runId, source, status, tenantId, ___type___ } =
      item as AutomationRun;

    const esItem: IAutomationESItem = {
      createdAt: created,
      runId,
      source,
      status,
      tenantId,
      type: ___type___,
    };

    await es.put(id, esItem);

    return;
  }
};

export default put;
