import { put } from "../stores/dynamo";
import contextStore from "../stores/automation-run-context-store";
import { applyAccessors } from "../apply-accessors";
import { AutomationCancelToken } from "~/automations/entities/cancel-token/cancel-token.entity";
import { query } from "~/lib/dynamo";

type S3ObjectPath = string;

export default (tenantId: string) => {
  return {
    create: async (params: {
      context: S3ObjectPath;
      token: string;
      runId: string;
    }) => {
      const { context, token, runId } = params;

      if (!token) {
        return undefined;
      }

      const runContext = await contextStore.get(context);

      const resolvedToken = await applyAccessors({ token }, runContext, {
        tenantId,
        runId,
      });

      const cancelToken = new AutomationCancelToken({
        runId,
        token: resolvedToken["token"],
        tenantId,
      });

      await put({
        Item: cancelToken.toItem(),
        TableName: process.env.AUTOMATION_RUNS_TABLE,
      });

      return cancelToken;
    },

    list: async (token: string) => {
      const { Items } = await query({
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": `${tenantId}/${token}`,
          ":sk": `${token}/run/`,
        },
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
        TableName: process.env.AUTOMATION_RUNS_TABLE,
      });

      return Items;
    },
  };
};
