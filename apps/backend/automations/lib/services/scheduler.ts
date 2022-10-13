import parser from "cron-parser";
import {
  IAutomationSchedulerService,
  IScheduleItem,
} from "~/automations/types";
import { update, id, getItem, query, deleteItem } from "../stores/dynamo";
import { TenantScope } from "~/types.internal";

export const calculateTTL = (value: string) => {
  // value is either a cron() or a date string
  const ISO8601 =
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
  const validISO8601 = ISO8601.test(value);

  if (validISO8601) {
    const scheduledTTL = Math.floor(new Date(value).getTime() / 1000);
    const now = Math.floor(new Date().getTime() / 1000);

    if (now > scheduledTTL) {
      return undefined;
    }

    return scheduledTTL;
  } else {
    try {
      const interval = parser.parseExpression(value);
      const nextTTL = Math.floor(
        new Date(interval.next().toString()).getTime() / 1000
      );

      return nextTTL;
    } catch (e) {
      return undefined;
    }
  }
};

export default (
  tenantId: string,
  scope: TenantScope
): IAutomationSchedulerService => {
  const getDynamoKey = (templateId: string, itemId: string) => ({
    pk: tenantId,
    sk: `${templateId}/${itemId}`,
  });

  return {
    calculateTTL,

    deleteItem: async (templateId: string, itemId: string) => {
      await deleteItem({
        Key: getDynamoKey(templateId, itemId),
        TableName: process.env.AUTOMATION_SCHEDULER_TABLE,
      });
    },

    getItem: async (templateId: string, itemId: string) => {
      const { Item } = await getItem({
        Key: getDynamoKey(templateId, itemId),
        TableName: process.env.AUTOMATION_SCHEDULER_TABLE,
      });

      if (!Item) {
        return;
      }

      return {
        cron: Item.cron,
        enabled: Item.enabled,
        itemId: Item.itemId,
        scope: Item.scope,
        dryRunKey: Item.dryRunKey,
        templateId: Item.templateId,
        tenantId: Item.tenantId,
        ttl: Item.ttl,
        value: Item.value,
      };
    },

    get: async (templateId: string) => {
      const { Items } = await query({
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": tenantId,
          ":sk": `${templateId}/`,
        },
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
        TableName: process.env.AUTOMATION_SCHEDULER_TABLE,
      });

      if (!Items) {
        return null;
      }

      return Items.map((Item) => ({
        cron: Item.cron,
        enabled: Item.enabled,
        itemId: Item.itemId,
        scope: Item.scope,
        dryRunKey: Item.dryRunKey,
        templateId: Item.templateId,
        tenantId: Item.tenantId,
        ttl: Item.ttl,
        value: Item.value,
      }));
    },

    saveItem: async (item: IScheduleItem) => {
      const itemId = item.itemId ?? id();

      const updateExpressions = [
        "#enabled = :enabled",
        "#itemId = if_not_exists(#itemId, :itemId)",
        "#scope = if_not_exists(#scope, :scope)",
        "#templateId = if_not_exists(#templateId, :templateId)",
        "#tenantId = if_not_exists(#tenantId, :tenantId)",
        "#ttl = :ttl",
        "#value = :value",
      ];

      await update({
        TableName: process.env.AUTOMATION_SCHEDULER_TABLE,
        Key: getDynamoKey(item.templateId, itemId),
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: {
          "#enabled": "enabled",
          "#itemId": "itemId",
          "#scope": "scope",
          "#templateId": "templateId",
          "#tenantId": "tenantId",
          "#ttl": "ttl",
          "#value": "value",
        },
        ExpressionAttributeValues: {
          ":enabled": item.enabled,
          ":itemId": itemId,
          ":scope": scope,
          ":templateId": item.templateId,
          ":tenantId": tenantId,
          ":ttl": item.ttl,
          ":value": item.value,
        },
      });
    },
  };
};
