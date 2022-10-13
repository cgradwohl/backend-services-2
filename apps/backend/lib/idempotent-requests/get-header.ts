import { ApiRequestContext } from "../lambda-response";

export const getIdempotencyKeyHeader = (context: ApiRequestContext) => {
  for (const header in context?.event?.headers) {
    if (header.toLowerCase() === "idempotency-key") {
      const value = context.event.headers[header];
      return !value || !value.trim() ? undefined : encodeURIComponent(value);
    }
  }
};

export default getIdempotencyKeyHeader;
