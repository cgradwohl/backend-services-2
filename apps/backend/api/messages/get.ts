import { NotFound } from "~/lib/http-errors";
import { assertPathParam, handleApi } from "~/lib/lambda-response";
import service from "~/lib/message-service";
import { Errors } from "~/lib/message-service/errors";
import instrumentApi from "~/lib/middleware/instrument-api";
import { IMessageLogResponse } from "~/types.public";

export const handler = handleApi<IMessageLogResponse>(
  instrumentApi<IMessageLogResponse>(async (context) => {
    try {
      const id = assertPathParam(context, "id");
      const result = await service.getById(context.tenantId, id);

      // TODO: remove when C-1927 ships
      if (!result) {
        throw new NotFound();
      }
      // TODO: remove when C-1927 ships

      return {
        body: {
          ...result,
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
