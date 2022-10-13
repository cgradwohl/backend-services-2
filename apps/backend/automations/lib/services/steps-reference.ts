import { AutomationStepReference } from "~/automations/entities/step-reference/step-reference.entity";
import { AutomationEntity } from "~/automations/entities/types";
import { IStep, IStepReference } from "~/automations/types";
import { simpleTransitionMetricCounter } from "~/lib/courier-emf/logger-metrics-utils";
import { getItem, update } from "../stores/dynamo";

export default (tenantId: string) => {
  const getDynamoKey = (runId: string, name: string) => ({
    pk: tenantId,
    sk: `${runId}/${name}`,
  });

  const create = async (ref: IStepReference) => {
    const updateExpression = [
      "#name = :name",
      "#runId = :runId",
      "#stepId = :stepId",
      "#tenantId = :tenantId",
      "#type = :type",
    ];

    await update({
      ConditionExpression:
        "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      ExpressionAttributeNames: {
        "#name": "name",
        "#runId": "runId",
        "#stepId": "stepId",
        "#tenantId": "tenantId",
        "#type": "___type___",
      },
      ExpressionAttributeValues: {
        ":name": ref.name,
        ":runId": ref.runId,
        ":stepId": ref.stepId,
        ":tenantId": ref.tenantId,
        ":type": AutomationEntity.Ref,
      },
      Key: AutomationStepReference.key({
        runId: ref.runId,
        name: ref.name,
      }),
      TableName: process.env.AUTOMATION_RUNS_TABLE,
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
    });
  };

  return {
    createRefs: async (steps: IStep[]): Promise<void> => {
      const stepsWithRefs = steps.filter((step) => step.ref);

      for (const step of stepsWithRefs) {
        await create({
          name: step.ref.trim(),
          runId: step.runId,
          stepId: step.stepId,
          tenantId: step.tenantId,
        });
      }
    },

    get: async (runId: string, name: string): Promise<IStepReference> => {
      const v2ModelResult = await getItem({
        Key: AutomationStepReference.key({ runId, name }),
        TableName: process.env.AUTOMATION_RUNS_TABLE,
      });

      if (v2ModelResult.Item) {
        await simpleTransitionMetricCounter({
          caller: "get",
          entity: AutomationEntity.Ref,
          isLegacy: false,
        });
        return v2ModelResult.Item as IStepReference;
      }

      const v1ModelResult = await getItem({
        Key: getDynamoKey(runId, name),
        TableName: process.env.AUTOMATION_RUNS_TABLE,
      });

      if (v1ModelResult.Item) {
        await simpleTransitionMetricCounter({
          caller: "get",
          entity: AutomationEntity.Ref,
          isLegacy: true,
        });
      }

      return v1ModelResult.Item as IStepReference;
    },
  };
};
