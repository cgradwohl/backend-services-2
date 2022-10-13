import { NotFound } from "~/lib/http-errors";
import {
  assertPathParam,
  getQueryParam,
  handleApi,
} from "~/lib/lambda-response";
import service from "~/lib/message-service";
import { Errors } from "~/lib/message-service/errors";
import instrumentApi from "~/lib/middleware/instrument-api";
import { IMessageHistoryResponse } from "~/types.public";

export const handler = handleApi<IMessageHistoryResponse>(
  instrumentApi<IMessageHistoryResponse>(async (context) => {
    try {
      const id = assertPathParam(context, "id");
      const type = getQueryParam(context, "type");

      // TODO: remove when C-1927 ships
      const message = await service.getById(context.tenantId, id);
      if (!message) {
        throw new NotFound();
      }
      // END TODO

      const results = await service.getHistoryById(context.tenantId, id, type);

      return {
        body: {
          results,
        },
      };
    } catch (err) {
      if (err instanceof Errors.MessageNotFoundError) {
        throw new NotFound("Message not found");
      } else {
        throw err;
      }
    }
  })
);
