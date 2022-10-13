import { assertIsNever } from "../assertions/is-never";
import * as handlers from "./webhook-handlers";
import { WorkOsWebhook } from "./webhook-types";

export async function handleWorkOsWebhook(
  webhook: WorkOsWebhook,
  timestamp: number
) {
  const { event, data } = webhook;
  try {
    switch (event) {
      case "dsync.user.created":
        return await handlers.handleDSyncUserCreated(data, timestamp);
      case "dsync.user.deleted":
        return await handlers.handleDSyncUserDeleted(data, timestamp);
      case "dsync.user.updated":
        return await handlers.handleDSyncUserUpdated(data, timestamp);
      default:
        assertIsNever(event, `Unsupported webhook ${event}`);
    }
  } catch (error) {
    console.warn(error);
  }
}
