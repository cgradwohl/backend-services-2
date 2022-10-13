import stepsService from "~/automations/lib/services/steps";
import { IAutomation, IStep } from "~/automations/types";
import { enqueueAutomationStep } from "./enqueue";

async function execute(run: IAutomation, steps: IStep[]) {
  const service = stepsService(run.tenantId);
  const serialSteps = await service.createSerialSteps(steps);

  const [step] = serialSteps;
  if (step === undefined) {
    return;
  }

  return enqueueAutomationStep({
    dryRunKey: run.dryRunKey,
    runId: run.runId,
    scope: run.scope,
    source: run.source,
    stepId: step.stepId,
    tenantId: run.tenantId,
  });
}

export default {
  execute,
};
