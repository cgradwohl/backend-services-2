import { toUuid } from "~/lib/api-key-uuid";
import { BadCursor } from "~/lib/elastic-search/messages";
import { BadRequest } from "~/lib/http-errors";
import { getQueryParam, handleApi } from "~/lib/lambda-response";
import service from "~/lib/message-service";
import instrumentApi from "~/lib/middleware/instrument-api";
import { IMessageLogListResponse } from "~/types.public";

export const handler = handleApi<IMessageLogListResponse>(
  instrumentApi<IMessageLogListResponse>(async (context) => {
    try {
      const notificationId = getQueryParam(context, "notification");

      const result = await service.list(context.tenantId, {
        archived: getQueryParam(context, "archived"),
        cursor: getQueryParam(context, "cursor"),
        eventId: getQueryParam(context, "event"),
        listId: getQueryParam(context, "list"),
        messageId: getQueryParam(context, "messageId"),
        notificationId: notificationId ? toUuid(notificationId) : undefined,
        recipient: getQueryParam(context, "recipient"),
        tags: getQueryParam(context, "tags")?.split(","),
        traceId: getQueryParam(context, "traceId"),
        status:
          context.event.multiValueQueryStringParameters?.status ?? undefined,
      });

      return {
        body: {
          ...result,
        },
      };
    } catch (err) {
      if (err instanceof BadCursor) {
        throw new BadRequest(err.message);
      }

      throw err;
    }
  })
);
