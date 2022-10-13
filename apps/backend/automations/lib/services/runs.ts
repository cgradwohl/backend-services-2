// tslint:disable: ordered-imports
import cancelationService from "./cancelation";
import ingestService from "./ingest";
import jsonStore from "../stores/automation-store";
import contextStore from "../stores/automation-run-context-store";
import {
  ICancelationReference,
  IAutomation,
  IAutomationInvokeRequest,
  IAutomationRunsService,
  AutomationRunStatus,
} from "~/automations/types";
import { getItem, put, query, update } from "../stores/dynamo";
import { mergeByStrategy } from "~/lib/merge-by-strategy";
import { MergeStrategy } from "~/types.public";
import { AutomationRun } from "~/automations/entities/run/run.entity";
import { AutomationCancelToken } from "~/automations/entities/cancel-token/cancel-token.entity";
import { CourierLogger } from "~/lib/logger";
import { simpleTransitionMetricCounter } from "~/lib/courier-emf/logger-metrics-utils";
import { AutomationEntity } from "~/automations/entities/types";

const { logger } = new CourierLogger("AutomationRuns");

export default (tenantId: string): IAutomationRunsService => {
  const getV1DynamoKey = (tenantId: string, runId: string) => {
    return {
      pk: `${tenantId}`,
      sk: `automation/${runId}`,
    };
  };

  const getRunByRunId = async (runId: string, tenantId: string) => {
    // first attempt to read using new data model
    const v2ModelResult = await getItem({
      Key: AutomationRun.key({ runId }),
      TableName: process.env.AUTOMATION_RUNS_TABLE,
    });

    if (v2ModelResult?.Item) {
      await simpleTransitionMetricCounter({
        caller: "get",
        entity: AutomationEntity.Run,
        isLegacy: false,
      });
      return v2ModelResult.Item;
    }

    // otherwise fallback to the legacy data model
    const v1ModelResult = await getItem({
      Key: getV1DynamoKey(tenantId, runId),
      TableName: process.env.AUTOMATION_RUNS_TABLE,
    });

    if (v1ModelResult.Item) {
      await simpleTransitionMetricCounter({
        caller: "get",
        entity: AutomationEntity.Run,
        isLegacy: true,
      });
    }

    return v1ModelResult.Item;
  };
  const cancelation = cancelationService(tenantId);
  const ingest = ingestService(tenantId);

  const getDynamoKey = (tenantId: string, runId: string) => {
    return {
      pk: `${tenantId}`,
      sk: `automation/${runId}`,
    };
  };

  // reuse in new service
  const getObjectKey = (tenantId: string, runId: string) =>
    `${tenantId}/${runId}.json`;

  return {
    cancel: async (token: string): Promise<void> => {
      // first attempt to read using new data model
      const tokenItems = await cancelation.list(token);

      if (tokenItems.length) {
        await simpleTransitionMetricCounter({
          caller: "list",
          entity: AutomationEntity.CancelToken,
          isLegacy: false,
        });

        for (const Item of tokenItems) {
          const token = AutomationCancelToken.fromItem(Item);

          await update({
            ExpressionAttributeNames: {
              "#status": "status",
              "#updated": "updated",
            },
            ExpressionAttributeValues: {
              ":status": AutomationRunStatus.canceled,
              ":updated": new Date().toISOString(),
            },
            Key: AutomationRun.key({ runId: token.runId }),
            TableName: process.env.AUTOMATION_RUNS_TABLE,
            ConditionExpression:
              "attribute_exists(pk) AND attribute_exists(sk)",
            UpdateExpression: "SET #status = :status, #updated = :updated",
          });
        }

        return;
      }

      // otherwise fallback to the legacy data model
      const { Items: cancelationRuns } = await query({
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": tenantId,
          ":sk": `${token}/run/`,
        },
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
        TableName: process.env.AUTOMATION_RUNS_TABLE,
      });

      if (cancelationRuns.length) {
        await simpleTransitionMetricCounter({
          caller: "list",
          entity: AutomationEntity.CancelToken,
          isLegacy: true,
        });
      }

      await Promise.all(
        (cancelationRuns as ICancelationReference[]).map(async (cancelRun) => {
          return update({
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":status": AutomationRunStatus.canceled,
            },
            Key: getDynamoKey(tenantId, cancelRun.runId),
            TableName: process.env.AUTOMATION_RUNS_TABLE,
            UpdateExpression: "SET #status = :status",
          });
        })
      );
    },

    create: async (run: IAutomation): Promise<void> => {
      const cancelToken = await cancelation.create({
        context: run?.context,
        runId: run.runId,
        token: run.cancelationToken,
      });

      const automationRun = new AutomationRun({
        cancelationToken: cancelToken?.token,
        context: run.context, // s3 key, not run context
        created: run.createdAt,
        dryRunKey: run.dryRunKey,
        runId: run.runId,
        scope: run.scope,
        source: run.source,
        status: AutomationRunStatus.processing,
        tenantId: run.tenantId,
      });

      await put({
        Item: automationRun.toItem(),
        TableName: process.env.AUTOMATION_RUNS_TABLE,
      });
    },

    get: async (runId: string): Promise<IAutomation> => {
      const key = getObjectKey(tenantId, runId);
      const json = await jsonStore.get(key);

      const document = await getRunByRunId(runId, tenantId);

      return {
        ...json,
        ...(document?.status ? { status: document.status } : undefined),
        ...(document?.updatedAt
          ? { updatedAt: document.updatedAt }
          : undefined),
      };
    },

    invoke: async (request: IAutomationInvokeRequest): Promise<void> => {
      const ingestableRun = {
        // NOTE: remove cancelationToken, deprecated syntax
        cancelation_token:
          request?.cancelation_token ?? request?.cancelationToken,
        dryRunKey: request.dryRunKey,
        scope: request.scope,
        source: request.source,
        steps: request.steps,
      };

      return ingest.createAutomationRun(
        request.runId,
        ingestableRun,
        request.context
      );
    },

    updateStatus: async (runId, status: AutomationRunStatus): Promise<void> => {
      const legacyUpdateStatus = async () => {
        // otherwise fallback to the legacy data model
        await update({
          ExpressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":status": status,
            ":updatedAt": new Date().toISOString(),
          },
          Key: getV1DynamoKey(tenantId, runId),
          TableName: process.env.AUTOMATION_RUNS_TABLE,
          UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
        });

        await simpleTransitionMetricCounter({
          caller: "updateStatus",
          entity: AutomationEntity.Run,
          isLegacy: true,
        });
      };
      // first attempt to update item using new data model
      try {
        await update({
          ExpressionAttributeNames: {
            "#status": "status",
            "#updated": "updated",
          },
          ExpressionAttributeValues: {
            ":status": status,
            ":updated": new Date().toISOString(),
          },
          Key: AutomationRun.key({ runId }),
          TableName: process.env.AUTOMATION_RUNS_TABLE,
          UpdateExpression: "SET #status = :status, #updated = :updated",
          ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
        });

        await simpleTransitionMetricCounter({
          caller: "updateStatus",
          entity: AutomationEntity.Run,
          isLegacy: false,
        });

        return;
      } catch (error) {
        // eat the conditional exception if new model item does not exists
        if (error.name === "ConditionalCheckFailedException") {
          logger.warn("Data Model Does Not Exists.");
          logger.warn(error);
          // fallback to legacy model
          await legacyUpdateStatus();
          return;
        }

        logger.error("Update Status Error:error", { error });
        logger.error("Update Status Error:tenantId", tenantId);
        logger.error("Update Status Error:runId", runId);
        throw error;
      }
    },

    getContext: async (runId: string) => {
      const key = getObjectKey(tenantId, runId);
      return contextStore.get(key);
    },

    /**
     * get existing run context
     * create a new context object by perfroming the merge based on the strategy
     * set new context
     * TODO: make stratgey optional, and only do merge if it exists
     */
    setContext: async (
      runId: string,
      strategy: MergeStrategy,
      context: any
    ) => {
      const key = getObjectKey(tenantId, runId);
      const existingContext = await contextStore.get(key);

      const mergedContext = mergeByStrategy(strategy, existingContext, context);

      await contextStore.put(key, mergedContext);
    },
  };
};
