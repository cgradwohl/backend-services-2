import { incrementErrorCount, markUndeliverable } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const providerError: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;

  const json =
    typeof event.json === "string" ? JSON.parse(event.json) : event.json;

  await markUndeliverable(tenantId, messageId, {
    configuration: json.configuration,
    errorMessage: json.errorMessage,
    provider: json.provider,
  });
  await incrementErrorCount(tenantId, messageId);
};
