import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import { IDelayStepFunctionData } from "~/automations/types";

export default async (event: IDelayStepFunctionData) => {
  const { dryRunKey, runId, scope, source, stepId, tenantId } = event;

  return enqueueAutomationStep({
    dryRunKey,
    runId,
    scope,
    source,
    stepId,
    tenantId,
  });
};
