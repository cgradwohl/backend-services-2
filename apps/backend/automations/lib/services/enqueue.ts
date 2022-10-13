import { AutomationRunStatus, IStepWorkerItem } from "~/automations/types";
import enqueue from "~/lib/enqueue";
import automationRuns from "../../lib/services/runs";

const enqueueMessage = enqueue<IStepWorkerItem>(
  process.env.SQS_AUTOMATION_STEP_QUEUE_NAME
);

export const enqueueAutomationStep = async (props: IStepWorkerItem) => {
  const {
    dryRunKey,
    runId,
    scope,
    source,
    stepId: nextStepId,
    tenantId,
  } = props;

  if (!nextStepId) {
    const runs = automationRuns(tenantId);

    return runs.updateStatus(runId, AutomationRunStatus.processed);
  }

  // triggers step worker
  return enqueueMessage({
    dryRunKey,
    runId,
    scope,
    source,
    stepId: nextStepId,
    tenantId,
  });
};
