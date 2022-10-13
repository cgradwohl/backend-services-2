import createEventHandler from "~/lib/kinesis/create-event-handler";
import { IAcceptAction, ISequenceAction } from "~/send/types";
import actionService from "~/send/service/actions";
import { nanoid } from "nanoid";
import { requests, sequenceActions } from "~/send/service/data";
import { putSequenceStream } from "./lib/put-sequence-stream";

const handler = async (event: ISequenceAction) => {
  const { requestId, sequenceId, sequenceActionId, tenantId } = event;

  // get original request
  const {
    apiVersion,
    dryRunKey,
    idempotencyKey,
    originFilePath,
    scope,
    source,
  } = await requests(tenantId).getPayload(requestId);

  const sequenceAction = await sequenceActions(event.tenantId).getPayloadById(
    sequenceActionId
  );

  // SEND ACTION LOGIC - nextStep is handled in Prepare
  // TODO: abstract this into local command pattern
  const nextRequestId = nanoid();
  await requests(tenantId).create({
    apiVersion,
    dryRunKey,
    idempotencyKey,
    originFilePath,
    jobId: undefined,
    params: {
      originalRequestId: requestId,
      sequenceId: sequenceAction.sequenceId,
      sequenceActionId: sequenceAction.sequenceActionId,
      nextSequenceActionId: sequenceAction.nextSequenceActionId,
    },
    requestId: nextRequestId,
    request: {
      message: sequenceAction.message,
    },
    scope,
    source,
    sequenceId,
    translated: undefined,
    triggerId: undefined,
  });

  await actionService(tenantId).emit<IAcceptAction>({
    command: "accept",
    dryRunKey,
    requestId: nextRequestId,
    tenantId,
  });
};

// TODO: add sequence error processing
export default createEventHandler(handler);
