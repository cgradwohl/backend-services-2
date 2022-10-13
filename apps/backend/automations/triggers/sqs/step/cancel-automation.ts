import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import { AutomationStepStatus, ICancelStep } from "~/automations/types";
import runsService from "../../../lib/services/runs";
import stepsService from "../../../lib/services/steps";

export default async (step: ICancelStep, params: any) => {
  const { dryRunKey, scope, source } = params;
  const runs = runsService(step.tenantId);
  const steps = stepsService(step.tenantId);

  await steps.markStepStatus(step, AutomationStepStatus.processing);

  // NOTE: remove cancelationToken syntax in favor of cancelation_token
  const token = step.cancelation_token ?? step.cancelationToken;

  await runs.cancel(token);

  await steps.markStepStatus(step, AutomationStepStatus.processed);

  await enqueueAutomationStep({
    dryRunKey,
    runId: step.runId,
    scope,
    source,
    stepId: step.nextStepId,
    tenantId: step.tenantId,
  });
};
