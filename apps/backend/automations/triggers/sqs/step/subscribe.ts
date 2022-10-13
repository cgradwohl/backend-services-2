import idempotentStep from "~/automations/lib/idempotentStep";
import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import stepsService from "~/automations/lib/services/steps";
import { AutomationStepStatus, ISubscribeStep } from "~/automations/types";
import { Conflict } from "~/lib/http-errors";
import { subscribe } from "~/lib/lists";
import { ListItemArchivedError } from "~/lib/lists/errors";

export default idempotentStep<ISubscribeStep>(async (step, params) => {
  const steps = stepsService(step.tenantId);
  await steps.markStepStatus(step, AutomationStepStatus.processing);

  const { dryRunKey, scope, source } = params;

  const { list_id, recipient_id, subscription } = step;

  try {
    await subscribe(
      step.tenantId,
      undefined,
      list_id,
      recipient_id,
      subscription?.preferences
    );
  } catch (e) {
    if (e instanceof ListItemArchivedError) {
      throw new Conflict("List has been archived");
    } else {
      throw e;
    }
  }

  await steps.markStepStatus(step, AutomationStepStatus.processed);

  await enqueueAutomationStep({
    dryRunKey,
    runId: step.runId,
    scope,
    source,
    stepId: step.nextStepId,
    tenantId: step.tenantId,
  });
});
