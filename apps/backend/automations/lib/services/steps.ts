import { applyAccessors } from "../apply-accessors";
import { extendStep } from "../extend-step";
import runContextStore from "../stores/automation-run-context-store";

import {
  AutomationStepStatus,
  IStep,
  Step,
  StepContext,
} from "~/automations/types";
import { getItem, id, put, query, update } from "../stores/dynamo";
import {
  DuplicateStepRefsDefinedError,
  InvalidStepReferenceError,
  SendStepContextNotFoundError,
  StepReferenceNotFoundError,
} from "../errors";

import { validRefNames } from "../regex";

import conditionEvaluator, {
  convertStatusToNumber,
  MessageStatus,
} from "./condition-evaluator";
import stepsReference from "./steps-reference";
import messageService from "~/lib/message-service";
import { AutomationStep } from "~/automations/entities/step/step.entity";
import { AutomationEntity } from "~/automations/entities/types";
import { simpleTransitionMetricCounter } from "~/lib/courier-emf/logger-metrics-utils";

export const validateConditionalRefs = (steps: IStep[]): boolean => {
  const getRefName = (step) => step.if.match(validRefNames);
  // a unique list of ref names that have been defined in each step.if
  const expectedRefNames = [
    ...new Set(
      steps
        .filter((step) => step.hasOwnProperty("if") && getRefName(step))
        .reduce((acc, step) => {
          // get list of unique refNames from step.if (there may be valid duplicates)
          acc.push(
            ...getRefName(step).map((ref) => {
              const [, result] = ref.split(".");
              return result;
            })
          );
          return acc;
        }, [])
    ),
  ];

  const actualRefNames = steps
    .filter((step) => step.ref)
    .map((step) => step.ref);
  const hasDuplicates = new Set(actualRefNames).size !== actualRefNames.length;
  if (hasDuplicates) {
    throw new DuplicateStepRefsDefinedError();
  }

  if (!expectedRefNames.length) {
    return true;
  }

  // validates that each step.if contains valid refs i.e. those that are defined in the run.
  const isValid = expectedRefNames.every((name) =>
    actualRefNames.includes(name)
  );

  if (!isValid) {
    throw new InvalidStepReferenceError();
  }

  return isValid;
};

const service = (tenantId: string) => {
  const refs = stepsReference(tenantId);

  const getStepByStepId = async (params: { runId: string; stepId: string }) => {
    const { runId, stepId } = params;
    // first attempt to read from the new
    const v2ModelResult = await getItem({
      Key: AutomationStep.key({ runId, stepId }),
      TableName: process.env.AUTOMATION_RUNS_TABLE,
    });

    if (v2ModelResult?.Item) {
      await simpleTransitionMetricCounter({
        caller: "get",
        entity: AutomationEntity.Step,
        isLegacy: false,
      });

      return v2ModelResult.Item;
    }

    // then fallback to the old
    const v1ModelResult = await getItem({
      Key: getDynamoKey({ runId, stepId }),
      TableName: process.env.AUTOMATION_RUNS_TABLE,
    });

    if (v1ModelResult.Item) {
      await simpleTransitionMetricCounter({
        caller: "get",
        entity: AutomationEntity.Step,
        isLegacy: true,
      });
    }

    return v1ModelResult.Item;
  };

  const getDynamoKey = (step: { runId: string; stepId: string }) => ({
    pk: `${tenantId}`,
    sk: `${step.runId}/step/${step.stepId}`,
  });

  const getRunContextObjectKey = (tenantId: string, runId: string) =>
    `${tenantId}/${runId}.json`;

  const get = async (runId: string, stepId: string): Promise<Step> => {
    const step = await getStepByStepId({ runId, stepId });

    const key = getRunContextObjectKey(tenantId, runId);
    const runContext = await runContextStore.get(key);

    const appliedStep = (await applyAccessors(step, runContext, step)) as Step;

    return extendStep(appliedStep, runContext);
  };

  const getStepMetaData = async (step: Step) => {
    switch (step.action) {
      case "send":
        if (step.status === AutomationStepStatus.skipped) {
          return {
            status: convertStatusToNumber(AutomationStepStatus.skipped),
          };
        }

        // const message = await getMessage(tenantId, step.context.messageId);
        const message = await messageService.getById(
          step.tenantId,
          step.context.messageId
        );

        if (!message) {
          throw new SendStepContextNotFoundError();
        }

        return {
          ...step.context,
          context: {
            ...step.context,
            providers: message.providers,
          },
          status: convertStatusToNumber(message.status),
        };

      default:
        return {
          ...step.context,
        };
    }
  };

  const getStepWithContextByRef = async (runId: string, name: string) => {
    const ref = await refs.get(runId, name);
    if (!ref) {
      throw new StepReferenceNotFoundError();
    }

    const step = await get(ref.runId, ref.stepId);
    if (!step) {
      throw new InvalidStepReferenceError();
    }

    const meta = await getStepMetaData(step);

    return {
      ...step,
      ...meta,
    };
  };

  const getRefsObject = async (runId: string, refNames: string[]) => {
    // take a list of ref names and turn it into a dictionary of:
    // { [refname]: "Enhanced/Enriched" Step }
    const refObject = {};
    for (const name of refNames) {
      const step = await getStepWithContextByRef(runId, name);
      refObject[name] = step;
    }

    return refObject;
  };

  return {
    createSerialSteps: async (steps: IStep[]) => {
      const hasConditionals = steps.some((step) => step.if);
      if (hasConditionals) {
        validateConditionalRefs(steps);
      }

      // serialize the steps
      const items = steps.map((step, index) => {
        return {
          ...step,
          nextStepId: steps[index + 1]?.stepId ?? null,
          prevStepId: steps[index - 1]?.stepId ?? null,
        };
      });

      // create the step items
      for (const item of items) {
        await put({
          Item: {
            ...AutomationStep.key({
              runId: item.runId,
              stepId: item.stepId,
            }),
            ...item,
            ___type___: AutomationEntity.Step,
            status: AutomationStepStatus.notProcessed,
          },
          TableName: process.env.AUTOMATION_RUNS_TABLE,
        });
      }

      const hasRefs = steps.some((step) => step.ref);
      if (hasRefs) {
        await refs.createRefs(steps);
      }

      return items;
    },

    evaluateCondition: async (step: Step): Promise<boolean> => {
      const refNames = step.if.match(validRefNames);
      if (!refNames) {
        // condition does not contain a refName so execute the javascript
        return conditionEvaluator(step.if, { ...step });
      }

      // get list of unique refNames from step.if
      const refsList = [
        ...new Set(
          refNames.map((ref) => {
            const [, result] = ref.split(".");
            return result;
          })
        ),
      ];

      const refsObject = await getRefsObject(step.runId, refsList);

      return conditionEvaluator(step.if, {
        ...step,
        MessageStatus,
        refs: refsObject,
      });
    },

    getDynamoKey,

    get,

    getStepWithContextByRef,

    id: () => id(),

    list: async (runId: string): Promise<IStep[]> => {
      const listStepsByRunId = async (params: { runId: string }) => {
        // first read from the new
        const v2ModelResult = await query({
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#sk": "sk",
          },
          ExpressionAttributeValues: {
            ":pk": `${runId}`,
            ":sk": `${runId}/step/`,
          },
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
          TableName: process.env.AUTOMATION_RUNS_TABLE,
        });

        if (v2ModelResult.Items.length) {
          await simpleTransitionMetricCounter({
            caller: "list",
            entity: AutomationEntity.Step,
            isLegacy: false,
          });
          return v2ModelResult.Items as IStep[];
        }

        // then fallback to the old
        const v1ModelResult = await query({
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#sk": "sk",
          },
          ExpressionAttributeValues: {
            ":pk": tenantId,
            ":sk": `${runId}/step/`,
          },
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
          TableName: process.env.AUTOMATION_RUNS_TABLE,
        });

        if (v1ModelResult.Items.length) {
          await simpleTransitionMetricCounter({
            caller: "list",
            entity: AutomationEntity.Step,
            isLegacy: true,
          });
        }

        return v1ModelResult.Items as IStep[];
      };

      const items = await listStepsByRunId({ runId });

      return items;
    },

    markStepStatus: async (
      step: IStep,
      status: AutomationStepStatus,
      context?: StepContext
    ) => {
      const legacyMarkStepStatus = async () => {
        const updateExpression = [
          ...Object.keys(context ?? {}).map(
            (key) => `context.#${key} = :${key}`
          ),
          "#status = :status",
          "#updatedAt = :updatedAt",
        ];

        const expressionAttributeNames = Object.assign(
          {},
          ...Object.keys(context ?? {}).map((key) => ({
            [`#${key}`]: key,
          })),
          {
            "#status": "status",
            "#updatedAt": "updatedAt",
          }
        );

        const expressionAttributeValues = Object.assign(
          {},
          ...Object.keys(context ?? {}).map((key) => ({
            [`:${key}`]: context[key],
          })),
          {
            ":status": `${status}`,
            ":updatedAt": new Date().toISOString(),
          }
        );

        await update({
          ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          Key: getDynamoKey(step),
          TableName: process.env.AUTOMATION_RUNS_TABLE,
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
        });

        await simpleTransitionMetricCounter({
          caller: "markStepStatus",
          entity: AutomationEntity.Step,
          isLegacy: true,
        });

        return;
      };
      // first attempt conditional update on new model
      try {
        const updateExpression = [
          ...Object.keys(context ?? {}).map(
            (key) => `context.#${key} = :${key}`
          ),
          "#status = :status",
          "#updated = :updated",
        ];

        const expressionAttributeNames = Object.assign(
          {},
          ...Object.keys(context ?? {}).map((key) => ({
            [`#${key}`]: key,
          })),
          {
            "#status": "status",
            "#updated": "updated",
          }
        );

        const expressionAttributeValues = Object.assign(
          {},
          ...Object.keys(context ?? {}).map((key) => ({
            [`:${key}`]: context[key],
          })),
          {
            ":status": `${status}`,
            ":updated": new Date().toISOString(),
          }
        );
        await update({
          ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          Key: AutomationStep.key({
            runId: step.runId,
            stepId: step.stepId,
          }),
          TableName: process.env.AUTOMATION_RUNS_TABLE,
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
        });
        await simpleTransitionMetricCounter({
          caller: "markStepStatus",
          entity: AutomationEntity.Step,
          isLegacy: false,
        });
        return;
      } catch (error) {
        // eat the conditional exception if new model item does not exists
        if (error.name === "ConditionalCheckFailedException") {
          console.warn("AutomationStep Data Model Does Not Exists", error);
          // fallback to legacy data model
          await legacyMarkStepStatus();
          return;
        } else {
          throw error;
        }
      }
    },
  };
};

service.id = id;

export default service;
