import { nanoid } from "nanoid";
import { AudienceRecipient, UserRecipient } from "~/api/send/types";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import { actionService, messageService } from "~/send/service";
import { requests } from "~/send/service/data";
import { IPrepareAction, ISendAudiencesMemberAction } from "~/send/types";

export const sendAudiencesMember = async (
  action: ISendAudiencesMemberAction
) => {
  const { requestId, tenantId } = action;

  const request = await requests(tenantId).getPayload(requestId);

  const { audience_id, ...restOfTo } = request?.message.to as AudienceRecipient;

  const { message, filePath: messageFilePath } = await messageService(
    action.tenantId
  ).create({
    message: {
      apiVersion: request.apiVersion,
      idempotencyKey: request.idempotencyKey,
      message: {
        ...request?.message,
        to: {
          ...restOfTo,
          user_id: action.memberId,
        } as UserRecipient,
      },
      messageId: nanoid(),
      requestId: request.requestId,
      sequenceId: request?.params?.sequenceId,
      sequenceActionId: request?.params?.sequenceActionId,
      nextSequenceActionId: request?.params?.nextSequenceActionId,
      source: request.source,
    },
  });

  await createLogEntry(
    action.tenantId,
    message.messageId,
    EntryTypes.eventReceived,
    {
      body: {
        message: {
          ...request?.message,
          to: {
            ...restOfTo,
            user_id: action.memberId,
          },
        },
      },
    }
  );

  await actionService(action.tenantId).emit<IPrepareAction>({
    command: "prepare",
    dryRunKey: request?.dryRunKey,
    messageId: message.messageId,
    messageFilePath,
    requestId: action.requestId,
    tenantId: action.tenantId,
  });
};
