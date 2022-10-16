import {
  AdHocListMessageRecipient,
  IAdHocListAction,
  IListAction,
  IListPatternAction,
  IPrepareAction,
} from "~/send/types";
import { actionService, messageService } from "~/send/service";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import { MessageRecipient, Recipient } from "~/api/send/types";
import { nanoid } from "nanoid";
import { requests } from "~/send/service/data";
import { CourierLogger } from "~/lib/logger";
import { FailedPreconditionSendError } from "~/send/errors";

export const adHocList = async (action: IAdHocListAction) => {
  const { requestId, tenantId } = action;
  try {
    const request = await requests(tenantId).getPayload(requestId);

    const recipients = request?.message.to as Recipient[];

    await Promise.all(
      recipients.map(async (recipient) => {
        if ("list_id" in recipient) {
          // write a new request object with the following modifications:
          //    1. params.originalRequestId
          //        a.  in "list" command, we use the originalRequestId as the idempotencyKey when sending across multiple lists.
          //            this ensures that when sending across multiple lists( i.e list pattern-based
          //            sends), recipients only receive that message ONCE.
          //
          //        b.  in "list" command, use the originalRequestId as the derived messages requestId. This
          //            is important tie the originalRequestId to derived messages.
          //
          //    2. list_id recipient
          //        - in "list" command, use "list_id" to fetch subscribers and send to them

          const requestId = `${request.requestId}/${nanoid()}`;

          await requests(tenantId).create({
            apiVersion: "2021-11-01",
            dryRunKey: request.dryRunKey,
            idempotencyKey: request.idempotencyKey,
            jobId: request.jobId,
            request: {
              message: {
                ...request?.message,
                to: {
                  ...recipient,
                  list_id: recipient.list_id,
                  ad_hoc_list_id: `anon_${nanoid()}`, // pass ad_hoc_list_id to tie message to a list (actual list_id should takes precedence)
                } as AdHocListMessageRecipient,
              },
            },
            requestId,
            scope: request.scope,
            source: request.source,
            sequenceId: request.sequenceId,
            triggerId: request.triggerId,
            translated: request?.translated,
            params: {
              originalRequestId: request.requestId,
              sequenceId: request?.params?.sequenceId,
              sequenceActionId: request?.params?.sequenceActionId,
              nextSequenceActionId: request?.params?.nextSequenceActionId,
            },
          });

          await actionService(tenantId).emit<IListAction>({
            command: "list",
            dryRunKey: request?.dryRunKey,
            requestId,
            tenantId,
          });
        } else if ("list_pattern" in recipient) {
          const requestId = `${request.requestId}/${nanoid()}`;
          // write a new request object with the following modifications:
          //    1. params.originalRequestId
          //        a.  in "list" command, we use the originalRequestId as the idempotencyKey when sending across multiple lists.
          //            this ensures that when sending across multiple lists( i.e list pattern-based
          //            sends), recipients only receive that message ONCE.
          //
          //        b.  in "list" command, use the originalRequestId as the derived messages requestId. This
          //            is important tie the originalRequestId to derived messages.
          //
          //    2. list_id recipient
          //        - in "list" command, use "list_id" to fetch subscribers and send to them
          await requests(tenantId).create({
            apiVersion: "2021-11-01",
            dryRunKey: request.dryRunKey,
            idempotencyKey: request.idempotencyKey,
            jobId: request.jobId,
            request: {
              message: {
                ...request?.message,
                to: {
                  ...recipient,
                  list_pattern: recipient.list_pattern,
                  ad_hoc_list_id: `anon_${nanoid()}`, // pass ad_hoc_list_id to tie message to a list (actual list_id should takes precedence)
                } as AdHocListMessageRecipient,
              },
            },
            requestId,
            scope: request.scope,
            source: request.source,
            sequenceId: request.sequenceId,
            triggerId: request.triggerId,
            translated: request?.translated,
            params: {
              originalRequestId: request.requestId,
              sequenceId: request?.params?.sequenceId,
              sequenceActionId: request?.params?.sequenceActionId,
              nextSequenceActionId: request?.params?.nextSequenceActionId,
            },
          });

          await actionService(tenantId).emit<IListPatternAction>({
            command: "list-pattern",
            dryRunKey: request?.dryRunKey,
            requestId,
            tenantId,
          });
        } else {
          const { message, filePath: messageFilePath } = await messageService(
            tenantId
          ).create({
            message: {
              apiVersion: request.apiVersion,
              idempotencyKey: request.idempotencyKey,
              message: {
                ...request?.message,
                // pass entire profile for downstream event log processing
                to: {
                  ...recipient,
                  ad_hoc_list_id: `anon_${nanoid()}`, // pass ad_hoc_list_id to tie message to a list (actual list_id should takes precedence)
                } as AdHocListMessageRecipient,
              },
              messageId: nanoid(),
              requestId: request.requestId,
              sequenceId: request?.params?.sequenceId,
              sequenceActionId: request?.params?.sequenceActionId,
              nextSequenceActionId: request?.params?.nextSequenceActionId,
              source: request.source,
            },
          });

          const { ad_hoc_list_id, ...restProfile } = message.message
            .to as MessageRecipient & { ad_hoc_list_id: string };

          // log out the derived message
          await createLogEntry(
            tenantId,
            message.messageId,
            EntryTypes.eventReceived,
            {
              body: {
                message: {
                  ...message.message,
                  to: restProfile,
                },
              },
            }
          );

          await actionService(tenantId).emit<IPrepareAction>({
            command: "prepare",
            dryRunKey: request?.dryRunKey,
            messageId: message.messageId,
            requestId: request.requestId,
            messageFilePath,
            tenantId,
          });
        }
      })
    );

    return undefined;
  } catch (error) {
    /**
     * NOTE: we need to do a better job of idempotent list processing.
     * In this implementation, it is impossible to retry an ad hoc list
     * without duplicate processing.
     */
    throw new FailedPreconditionSendError(error, {
      tenantId,
      requestId,
    });
  }
};
