import { getLogItem } from "~/lib/dynamo/event-logs";
import { NotFound } from "~/lib/http-errors";

export default async ({ tenantId, outputId, content }) => {
  const logItem = await getLogItem(tenantId, outputId);

  if (!logItem) {
    throw new NotFound("Log entry not found");
  }

  return logItem.json?.renderedTemplate?.[content] ?? [];
};
