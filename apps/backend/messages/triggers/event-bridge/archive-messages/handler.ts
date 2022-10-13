import { EventBridgeHandler } from "aws-lambda";
import { createArchivedEvent } from "~/lib/dynamo/event-logs";
import { putEvents } from "~/lib/eventbridge";

import messagesServiceApiV1 from "~/messages/service/api-v1";
import { MissingEventFieldsError } from "~/messages/service/api-v1/errors";
import {
  IMessageArchiveEvent,
  MessageArchiveEventDetailType,
} from "~/messages/types/api-v1/message";
import { FullMessage } from "~/types.api";

type Worker = EventBridgeHandler<
  MessageArchiveEventDetailType,
  IMessageArchiveEvent,
  void
>;

const worker: Worker = async (record) => {
  const { cursor, requestId, workspaceId } = record.detail;

  if (!requestId || !workspaceId) {
    throw new MissingEventFieldsError();
  }

  const service = messagesServiceApiV1(workspaceId);
  const { items, paging } = await service.listByRequestId(requestId, cursor);

  // iterate through messages and generate archived event
  await Promise.all(
    items.map(async (item) => {
      // this felt much easier than using toItem and getShard abstractions
      const { messageId } = item as unknown as FullMessage;
      await createArchivedEvent(workspaceId, messageId, {});
    })
  );

  // emit next event with the pagination cursor
  if (paging.more) {
    await putEvents([
      {
        Detail: JSON.stringify({
          cursor: paging.cursor,
          requestId,
          workspaceId,
        }),
        DetailType: MessageArchiveEventDetailType,
        Source: "courier.api",
      },
    ]);
  }
};

export default worker;
