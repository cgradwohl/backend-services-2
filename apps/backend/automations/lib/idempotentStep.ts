import { parseISO } from "date-fns";
import * as idempotentRequests from "~/lib/idempotent-requests";
import { AutomationStepStatus, IdempotentStep } from "../types";
import { InvalidIdempotencyExpiryError } from "./errors";
import { enqueueAutomationStep } from "./services/enqueue";
import stepsService from "./services/steps";
type Callback<T> = (step: T, params: any) => Promise<void>;

const getIdempotencyExpiration = (step: IdempotentStep) => {
  const value = step.idempotency_expiry;

  if (!value || !value.trim()) {
    return;
  }

  const expiration = !Number.isNaN(parseISO(value).getTime())
    ? parseISO(value).getTime()
    : Number.parseInt(value, 10);

  if (Number.isNaN(expiration)) {
    throw new InvalidIdempotencyExpiryError();
  }

  return expiration;
};

const idempotentStep = <T extends IdempotentStep>(callback: Callback<T>) => {
  return async (step: T, params: any) => {
    const { idempotency_key, tenantId } = step;
    const { dryRunKey, scope, source } = params;

    if (!idempotency_key) {
      // no idempotencyKey found. follow normal processing rules.
      await callback(step, params);
      return;
    }

    const idempotentRequest = await idempotentRequests.get(
      tenantId,
      idempotency_key
    );
    // idempotent request found. short-circuit processing
    if (idempotentRequest) {
      const steps = stepsService(step.tenantId);
      await steps.markStepStatus(step, AutomationStepStatus.skipped);

      const serialRun =
        step.hasOwnProperty("prevStepId") && step.hasOwnProperty("nextStepId");
      if (serialRun) {
        await enqueueAutomationStep({
          dryRunKey,
          runId: step.runId,
          scope,
          source,
          stepId: step.nextStepId,
          tenantId: step.tenantId,
        });
        return;
      }

      return;
    }

    try {
      const idempotencyExpiration = getIdempotencyExpiration(step);
      await idempotentRequests.put(
        tenantId,
        idempotency_key,
        { body: undefined, statusCode: undefined },
        { ttl: idempotencyExpiration }
      );
    } catch (error) {
      const steps = stepsService(step.tenantId);
      await steps.markStepStatus(step, AutomationStepStatus.error);

      throw new InvalidIdempotencyExpiryError();
    }

    await callback(step, params);
    return;
  };
};
export default idempotentStep;
