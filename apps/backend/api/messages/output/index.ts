import { MethodNotAllowed } from "~/lib/http-errors";
import { assertPathParam, handleApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";
import { IMessageOutputResponse } from "~/types.public";
import getOutput from "./lib/get-output";
import getOutputContent from "./lib/get-output-content";

export const handler = handleApi<IMessageOutputResponse>(
  instrumentApi<IMessageOutputResponse>(async (context) => {
    const tenantId = context.tenantId;
    const resource = context.event.resource;

    switch (resource) {
      case "/messages/{id}/output/{outputId}/{content}": {
        const outputId = assertPathParam(context, "outputId");
        const content = assertPathParam(context, "content");
        return {
          body: await getOutputContent({ tenantId, outputId, content }),
          headers: { "Content-Type": "text/html" },
          transform: (value) => value, // To prevent stringifying HTML content
        };
      }
      case "/messages/{id}/output": {
        const messageId = assertPathParam(context, "id");
        return {
          body: {
            results: await getOutput(tenantId, messageId),
          },
        };
      }
      default: {
        throw new MethodNotAllowed();
      }
    }
  })
);
