import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import runsService from "~/automations/lib/services/runs";
import stepsService from "~/automations/lib/services/steps";
import delayService from "~/automations/lib/services/delay";
import {
  AutomationRunStatus,
  AutomationStepStatus,
  IDelayStep,
} from "~/automations/types";

const complete = async (step: IDelayStep, params: any) => {
  const { dryRunKey, scope, source } = params;
  const runs = runsService(step.tenantId);
  const steps = stepsService(step.tenantId);

  await steps.markStepStatus(step, AutomationStepStatus.processed, {
    actualDelayValue: new Date().toISOString(),
  });

  await runs.updateStatus(step.runId, AutomationRunStatus.processing);

  await enqueueAutomationStep({
    dryRunKey,
    runId: step.runId,
    scope,
    source,
    stepId: step.nextStepId,
    tenantId: step.tenantId,
  });
};

const enqueue = async (step: IDelayStep, params: any) => {
  const runs = runsService(step.tenantId);
  const steps = stepsService(step.tenantId);
  const delay = new delayService(step);
  const { dryRunKey, scope, source } = params;

  await delay.enqueueDelay({ dryRunKey, scope, source });

  await steps.markStepStatus(step, AutomationStepStatus.waiting, {
    expectedDelayValue: new Date(delay.getDelayUnixTime() * 1000).toISOString(),
  });

  await runs.updateStatus(step.runId, AutomationRunStatus.waiting);
};

export default async (step: IDelayStep, params: any) => {
  switch (step.status) {
    case AutomationStepStatus.notProcessed:
      await enqueue(step, params);
      break;
    case AutomationStepStatus.waiting:
      await complete(step, params);
      break;
  }
};
