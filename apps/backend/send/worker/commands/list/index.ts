import { IListAction, IPrepareAction } from "~/send/types";
import { actionService, messageService } from "~/send/service";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import { getSubscriptions } from "~/lib/lists";
import { ListRecipient, UserRecipient } from "~/api/send/types";
import { put as putIdempotencyKey } from "~/lib/idempotent-requests";
import { nanoid } from "nanoid";
import { requests } from "~/send/service/data";
import { FailedPreconditionSendError } from "~/send/errors";

export const list = async (action: IListAction) => {
  const { exclusiveStartKey, requestId, tenantId } = action;
  const request = await requests(tenantId).getPayload(requestId);

  const listId = (request?.message?.to as ListRecipient).list_id;

  try {
    const { lastEvaluatedKey, items: subscribers } = await getSubscriptions(
      tenantId,
      listId!,
      {
        exclusiveStartKey,
        limit: 100,
      }
    );

    if (lastEvaluatedKey) {
      // fire off another list command, with the next page of subscribers
      await actionService(tenantId).emit<IListAction>({
        command: "list",
        dryRunKey: request?.dryRunKey,
        requestId: request.requestId,
        tenantId,
        exclusiveStartKey: lastEvaluatedKey,
      });
    }

    await Promise.all(
      subscribers.map(async (subscriber) => {
        const requestId =
          request?.params?.originalRequestId ?? request.requestId;

        // create an idempotency key per subscriber
        await putIdempotencyKey(
          tenantId,
          `${requestId}/${subscriber.recipientId}`,
          {
            body: "",
            statusCode: 200,
          }
        );

        const { message, filePath: messageFilePath } = await messageService(
          tenantId
        ).create({
          message: {
            apiVersion: request.apiVersion,
            idempotencyKey: request.idempotencyKey,
            message: {
              ...request.message,
              to: {
                // pass entire profile for downstream event log processing
                ...(request.message.to as ListRecipient & UserRecipient),
                user_id: subscriber.recipientId,
              },
            },
            messageId: nanoid(),
            requestId,
            sequenceId: request?.params?.sequenceId,
            sequenceActionId: request?.params?.sequenceActionId,
            nextSequenceActionId: request?.params?.nextSequenceActionId,
            source: request.source,
          },
        });

        // log out the derived message
        await createLogEntry(
          tenantId,
          message.messageId,
          EntryTypes.eventReceived,
          {
            body: {
              message: {
                ...message.message,
                to: {
                  user_id: subscriber.recipientId,
                },
              },
            },
          }
        );

        await actionService(tenantId).emit<IPrepareAction>({
          command: "prepare",
          dryRunKey: request.dryRunKey,
          messageFilePath,
          messageId: message.messageId,
          requestId,
          tenantId,
        });
      })
    );

    return undefined;
  } catch (error) {
    /**
     * NOTE: we need an idempotent list processing solution.
     * In its current implementation we have to way to retry the request
     * without duplicate processing.
     */
    throw new FailedPreconditionSendError(error, {
      tenantId,
      exclusiveStartKey: exclusiveStartKey as unknown as string,
      requestId,
      listId,
    });
  }
};
