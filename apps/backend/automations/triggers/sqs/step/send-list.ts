import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import stepsService from "~/automations/lib/services/steps";
import { AutomationStepStatus, ISendListStep } from "~/automations/types";
import enqueue from "~/lib/enqueue";
import { get as getList } from "~/lib/lists";
import jsonStore from "~/lib/s3";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { SqsSendListOrPatternMessage } from "~/types.internal";
import { S3SendListOrPatternMessage } from "~/types.internal";
import idempotentStep from "~/automations/lib/idempotentStep";
import { get as getBrand, getDefault } from "~/lib/brands";
import { ListNotFoundError } from "~/automations/lib/errors";
import NotFoundError from "~/lib/http-errors/not-found";

const { put: putListOrPatternMessage } = jsonStore<S3SendListOrPatternMessage>(
  process.env.S3_MESSAGES_BUCKET
);

const enqueueSendListOrPatternMessage = enqueue<SqsSendListOrPatternMessage>(
  process.env.SQS_SEND_LIST_OR_PATTERN_QUEUE_NAME
);

const getListObject = async (tenantId: string, listId: string) => {
  try {
    const list = await getList(tenantId, listId);

    return list;
  } catch (error) {
    if (error instanceof NotFoundError) {
      // throw expected error as an instance of AutomationError
      throw new ListNotFoundError(
        `The list ${listId}, was not found. Please provide a valid listId.`
      );
    }

    throw error;
  }
};

export default idempotentStep<ISendListStep>(async (step, params) => {
  const steps = stepsService(step.tenantId);

  await steps.markStepStatus(step, AutomationStepStatus.processing);

  const { dryRunKey, scope, source } = params;

  const brandId = step.brand ?? (await getDefault(step.tenantId)).id;
  const brand = await getBrand(step.tenantId, brandId, {
    extendDefaultBrand: true,
  });

  const list = await getListObject(step.tenantId, step.list);

  const messageId = createTraceId();

  const type = "send-list";
  const fileName = `${type}-${messageId}`;
  const filePath = `${step.tenantId}/${fileName}.json`;

  // save to s3
  const message: S3SendListOrPatternMessage = {
    brand,
    dataSource: step.data_source,
    eventData: step.data,
    eventId: step.template,
    list,
    override: step.override,
    dryRunKey,
    scope,
  };

  await putListOrPatternMessage(filePath, message);

  // enqueue message
  await enqueueSendListOrPatternMessage({
    messageId,
    messageLocation: {
      path: filePath,
      type: "S3",
    },
    originalMessageId: messageId, // TODO: is this correct?
    tenantId: step.tenantId,
    type,
  });

  await steps.markStepStatus(step, AutomationStepStatus.processed, {
    messageId,
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
