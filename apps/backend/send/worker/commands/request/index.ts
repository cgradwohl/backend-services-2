import { SequenceRequest } from "~/api/send/types";
import { actionService } from "~/send/service";
import { requests, sequenceActions, sequences } from "~/send/service/data";
import { getJson } from "~/send/stores/s3/requests";
import {
  IAcceptAction,
  IRequestAction,
  SendActionCommands,
} from "~/send/types";
import { putSequenceStream } from "../../sequence/lib/put-sequence-stream";
import {
  DeliveryProgressionMetric,
  translationProgressionMetric,
} from "~/lib/courier-emf/logger-metrics-utils";
import { CourierEmf } from "~/lib/courier-emf";
import { Unit } from "aws-embedded-metrics";

type SequenceProcessor = (params: {
  event: IRequestAction;
  idempotencyKey: string | undefined;
  originFilePath: string;
  request: SequenceRequest;
  translated: boolean;
}) => Promise<void>;

const sequenceProcessing: SequenceProcessor = async ({
  event,
  idempotencyKey,
  originFilePath,
  request,
  translated = false,
}) => {
  const { apiVersion, dryRunKey, requestId, scope, source, tenantId } = event;

  // create single sequence per request (Dynamo item + S3 payload)
  // TODO: throw specific error from service
  const sequence = await sequences(tenantId).create({
    parentSequenceId: undefined,
    requestId,
    sequence: request.sequence,
    triggerId: undefined,
  });

  // create single request (Dynamo item + S3 payload)
  // TODO: throw specific error from service
  await requests(tenantId).create({
    apiVersion,
    dryRunKey,
    idempotencyKey,
    jobId: undefined,
    originFilePath,
    requestId,
    request,
    scope,
    source,
    sequenceId: sequence.sequenceId,
    triggerId: sequence.triggerId,
    translated,
  });

  // create many sequence-actions per sequence (Dyanmo item + S3 payload)
  // TODO: throw specific error from service
  const [action] = await sequenceActions(tenantId).create({
    sequence: request.sequence,
    sequenceId: sequence.sequenceId,
    requestId,
    triggerId: sequence.triggerId,
  });

  await putSequenceStream({
    command: "sequence",
    dryRunKey,
    sequenceId: action.sequenceId,
    sequenceActionId: action.sequenceActionId,
    requestId,
    tenantId,
  });
};

export const request = async (action: IRequestAction) => {
  if (action?.shouldVerifyRequestTranslation === true) {
    await translationProgressionMetric({
      action: SendActionCommands.Request,
      properties: {
        traceId: action.requestId,
        tenantId: action.tenantId,
      },
      version: "v2",
    });
  }

  const {
    apiVersion,
    dryRunKey,
    requestFilePath,
    requestId,
    scope,
    source,
    tenantId,
    shouldUseRouteTree,
    translated,
  } = action;

  const { idempotencyKey, request } = await getJson({
    filePath: requestFilePath,
  });

  if (request?.sequence) {
    return await sequenceProcessing({
      event: action,
      originFilePath: requestFilePath,
      request: request as SequenceRequest,
      idempotencyKey,
      translated,
    });
  }

  await requests(tenantId).create({
    apiVersion,
    dryRunKey,
    idempotencyKey,
    jobId: undefined,
    originFilePath: requestFilePath,
    requestId,
    request,
    scope,
    source,
    sequenceId: undefined,
    translated,
    triggerId: undefined,
  });

  await DeliveryProgressionMetric({
    action: SendActionCommands.Request,
    properties: {
      traceId: action.requestId,
      tenantId: action.tenantId,
    },
  });

  await actionService(tenantId).emit<IAcceptAction>({
    command: "accept",
    dryRunKey,
    requestId,
    tenantId,
    shouldVerifyRequestTranslation:
      action?.shouldVerifyRequestTranslation ?? false,
    translated: action?.translated ?? false,
    shouldUseRouteTree,
  });
};
