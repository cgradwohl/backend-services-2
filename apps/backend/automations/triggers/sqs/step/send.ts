import { nanoid } from "nanoid";
import { saveAndEnqueue } from "~/api/send";
import { InvalidBrandId } from "~/automations/lib/errors";
import idempotentStep from "~/automations/lib/idempotentStep";
import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import stepsService from "~/automations/lib/services/steps";
import { AutomationStepStatus, ISendStep } from "~/automations/types";
import { get as getBrandObject } from "~/lib/brands";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import { create as createMessage } from "~/lib/dynamo/messages";
import { NotFound } from "~/lib/http-errors";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { actionService, requestService } from "~/send/service";
import { IRequestAction } from "~/send/types";
import { S3PrepareMessage } from "~/types.internal";

const getBrand = async (tenantId: string, brandId: string) => {
  if (!brandId) {
    return null;
  }

  try {
    const brand = await getBrandObject(tenantId, brandId, {
      extendDefaultBrand: true,
    });

    return brand;
  } catch (error) {
    if (error instanceof NotFound) {
      throw new InvalidBrandId();
    }

    throw error;
  }
};

const sendV2 = async (step: ISendStep, params): Promise<void> => {
  const { dryRunKey, scope, source } = params;

  const requestId = nanoid();

  const { filePath } = await requestService(step.tenantId).create({
    apiVersion: "2021-11-01",
    dryRunKey,
    idempotencyKey: step?.idempotency_key,
    request: {
      message: step.message,
    },
    requestId,
    scope,
    source,
  });

  await actionService(step.tenantId).emit<IRequestAction>({
    command: "request",
    apiVersion: "2021-11-01",
    dryRunKey,
    requestFilePath: filePath,
    requestId,
    scope,
    source,
    tenantId: step.tenantId,
  });

  return undefined;
};

const sendV1 = async (step, params) => {
  const { dryRunKey, scope, source } = params;
  const brand = await getBrand(step.tenantId, step.brand);

  const message: S3PrepareMessage = {
    brand,
    eventId: step.template,
    eventData: step.data,
    eventProfile: step.profile,
    override: step.override,
    recipientId: step.recipient,
    dryRunKey,
    scope,
  };

  const messageId = createTraceId();

  await createLogEntry(step.tenantId, messageId, EntryTypes.eventReceived, {
    body: {
      event: message.eventId,
      brand: step.brand,
      data: step.data,
      profile: step.profile,
      override: step.override,
      runId: step.runId,
      source,
      recipient: step.recipient,
    },
  });

  await createMessage(
    step.tenantId,
    message.eventId,
    message.recipientId,
    messageId,
    null,
    null,
    null,
    {
      automationRunId: step.runId, // TODO: update ELASTIC SEARCH!
      source, // TODO: update ELASTIC SEARCH!
    }
  );

  await saveAndEnqueue(messageId, step.tenantId, message);

  return messageId;
};

const send = async (step, params) => {
  if (step.message) {
    return await sendV2(step, params);
  } else {
    return await sendV1(step, params);
  }
};

export default idempotentStep<ISendStep>(async (step, params) => {
  const steps = stepsService(step.tenantId);

  await steps.markStepStatus(step, AutomationStepStatus.processing);
  const { dryRunKey, scope, source } = params;

  const messageId = await send(step, params);

  await steps.markStepStatus(step, AutomationStepStatus.processed, {
    ...(messageId ? { messageId } : undefined),
  });

  await enqueueAutomationStep({
    dryRunKey,
    runId: step.runId,
    scope,
    source,
    stepId: step.nextStepId,
    tenantId: step.tenantId,
  });
});
