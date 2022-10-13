import {
  markUndeliverable,
  markUndeliverableFromDelivery,
} from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const undeliverable: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId, json } = event;
  const payload = typeof json === "string" ? JSON.parse(json) : json;

  payload?.deliveryStatusCheckFailed
    ? await markUndeliverableFromDelivery(tenantId, messageId, payload)
    : await markUndeliverable(tenantId, messageId);
};
