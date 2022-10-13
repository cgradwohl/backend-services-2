import { EventBridgeHandler } from "aws-lambda";
import { UnexpectedEventTypeError } from "~/auditing/lib/errors";

import {
  ApiKeyAuditEvent,
  AuditEventDetailType,
  AuditEventTypes,
  IBaseAuditEvent,
} from "~/auditing/types";
import courierClientFactory from "~/lib/courier";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import { CourierLogger } from "~/lib/logger";
import createMessage from "./create-message";

type Worker = EventBridgeHandler<AuditEventDetailType, IBaseAuditEvent, void>;

const courier = courierClientFactory();
const { logger } = new CourierLogger("api-key-change-notifier");

function assertIsApiKeyAuditEvent(
  event: IBaseAuditEvent
): asserts event is ApiKeyAuditEvent {
  if (
    event.type !== AuditEventTypes.API_KEY_CREATED &&
    event.type !== AuditEventTypes.API_KEY_DELETED &&
    event.type !== AuditEventTypes.API_KEY_ROTATED
  ) {
    throw new UnexpectedEventTypeError(event.type);
  }
}

const worker: Worker = async (record) => {
  assertIsApiKeyAuditEvent(record.detail);

  const hasFeature = await getFeatureTenantVariation(
    "temp.audit.notifications",
    record.detail.workspaceId
  );

  if (!hasFeature) {
    return;
  }

  const message = await createMessage(record.detail);
  logger.info(message);
  await courier.send({ message });
};

export default worker;
