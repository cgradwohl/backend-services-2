import { getItem, update } from "~/lib/dynamo";
import { IWebhookLog } from "../types";

type GetKeyFn = (
  tenantId: string,
  webhookId: string,
  discrminator: string
) => {
  pk: string;
  sk: string;
};

const getKey: GetKeyFn = (tenantId, webhookId, discriminator) => ({
  pk: tenantId,
  sk: `${webhookId}/${discriminator}`,
});

export default (tenantId: string) => {
  return {
    async get(
      webhookId: string,
      discriminator: string
    ): Promise<IWebhookLog | null> {
      const response = await getItem({
        Key: getKey(tenantId, webhookId, discriminator),
        TableName: process.env.WEBHOOK_LOGS_TABLE_NAME,
      });

      return (response.Item as IWebhookLog) ?? null;
    },

    async update(
      log: IWebhookLog,
      discriminator: string
    ): Promise<IWebhookLog> {
      const date = new Date().toISOString();
      const pk = tenantId;

      const updateExpressions = [
        "logStatus = :logStatus",
        "logType = :logType",
        "objectId = :objectId",
        "#req = :req",
        "#res = :res",
        "#ts = :ts",
        "webhookId = :webhookId",
      ];

      const updates = {
        ...log,
        ts: date,
      };

      await update({
        ExpressionAttributeNames: {
          "#req": "request",
          "#res": "response",
          "#ts": "timestamp",
        },
        ExpressionAttributeValues: {
          ":logStatus": updates.status,
          ":logType": updates.logType,
          ":objectId": updates.objectId,
          ":req": updates.request,
          ":res": {
            ...updates.response,
            // request is an instance of ClientRequest and not serializable
            request: undefined,
          },
          ":ts": updates.ts,
          ":webhookId": updates.webhookId,
        },
        Key: getKey(pk, updates.webhookId, discriminator),
        TableName: process.env.WEBHOOK_LOGS_TABLE_NAME,
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      });

      return updates;
    },
  };
};
