import { putJson } from "../stores/s3/requests";
import { IRequest, RequestService } from "../types";

const requestService: RequestService = (tenantId: string) => {
  return {
    create: async ({
      apiVersion,
      dryRunKey,
      idempotencyKey,
      jobId,
      params,
      request,
      requestId,
      scope,
      source,
      translated = false,
    }) => {
      const json: IRequest = {
        apiVersion,
        dryRunKey,
        idempotencyKey,
        jobId,
        params,
        request,
        requestId,
        scope,
        source,
        translated,
      };

      const { filePath } = await putJson({ requestId, json });

      // TODO: https://linear.app/trycourier/issue/C-5186/update-documentation-for-messagetimeoutsmessage
      return { filePath };
    },
  };
};

export default requestService;
