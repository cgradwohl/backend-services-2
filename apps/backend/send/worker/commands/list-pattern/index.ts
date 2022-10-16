import { ListPatternRecipient } from "~/api/send/types";
import { actionService } from "~/send/service";
import { IListAction, IListPatternAction } from "~/send/types";
import { list as getLists } from "~/lib/lists";
import { nanoid } from "nanoid";
import { requests } from "~/send/service/data";
import { FailedPreconditionSendError } from "~/send/errors";

export const listPattern = async (action: IListPatternAction) => {
  const { exclusiveStartKey, requestId: actionRequestId, tenantId } = action;

  const request = await requests(tenantId).getPayload(actionRequestId);

  const requestId = request?.params?.originalRequestId ?? request.requestId;

  const pattern = (request?.message.to as ListPatternRecipient).list_pattern;

  try {
    const { lastEvaluatedKey, items: lists } = await getLists(tenantId, {
      exclusiveStartKey,
      pattern,
    });

    if (lastEvaluatedKey) {
      // fire off another list command, with the next page of list_ids
      await actionService(tenantId).emit<IListPatternAction>({
        command: "list-pattern",
        dryRunKey: request.dryRunKey,
        requestId,
        tenantId,
        exclusiveStartKey: lastEvaluatedKey,
      });
    }

    await Promise.all(
      lists.map(async (list) => {
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
        const newRequestId = `${requestId}/${nanoid()}`; // {originalRequestId}/{nanoid()}

        await requests(tenantId).create({
          apiVersion: "2021-11-01",
          dryRunKey: request.dryRunKey,
          idempotencyKey: request.idempotencyKey,
          jobId: request.jobId,
          request: {
            message: {
              ...request.message,
              to: {
                list_id: list.id,
              },
            },
          },
          requestId: newRequestId,
          scope: request.scope,
          source: request.source,
          sequenceId: request.sequenceId,
          triggerId: request.triggerId,
          translated: request?.translated,
          params: {
            originalRequestId: requestId,
            sequenceId: request?.params?.sequenceId,
            sequenceActionId: request?.params?.sequenceActionId,
            nextSequenceActionId: request?.params?.nextSequenceActionId,
          },
        });

        await actionService(tenantId).emit<IListAction>({
          command: "list",
          dryRunKey: request.dryRunKey,
          requestId: newRequestId,
          tenantId,
        });
      })
    );

    return undefined;
  } catch (error) {
    /**
     * NOTE: we need a better idempotent list processing solution.
     * in its current form, this implementation is impossible to retry
     * without duplicate sends.
     */
    throw new FailedPreconditionSendError(error, {
      exclusiveStartKey: exclusiveStartKey as unknown as string,
      actionRequestId,
      tenantId,
      requestId,
      pattern,
    });
  }
};
