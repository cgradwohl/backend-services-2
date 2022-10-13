import { ApiErrorResponse } from "~/types.public";

import { incrementMetric } from "../datadog";
import { ApiRequestContext, HandlerApiCallback } from "../lambda-response";

type CallbackFn<TOutput> = HandlerApiCallback<TOutput | ApiErrorResponse>;
export default <TOutput>(callback: CallbackFn<TOutput>) => {
  return async (context: ApiRequestContext) => {
    await incrementMetric(context.tenantId, "api.http.event", {
      tags: [
        `method:${context.event.httpMethod.toLowerCase()}`,
        `resource:${context.event.resource}`,
      ],
    });
    return callback(context);
  };
};
