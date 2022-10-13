import { MessageNotFoundError } from "~/messages/service/api-v1/errors";

import { FullMessage } from "../../types.api";
import { MessageHistoryType } from "../message-service/types";
import * as messagesV2 from "./messages-v2";
import * as messagesV3 from "./messages-v3-adapter";

export const get = async (
  tenantId: string,
  messageId: string
): Promise<FullMessage | null> => {
  const v3Message = await messagesV3.get(tenantId, messageId);
  if (v3Message) {
    return v3Message;
  }

  const v2Message = await messagesV2.get(tenantId, messageId);
  return v2Message;
};

export const create = async (
  tenantId: string,
  eventId: string,
  recipientId: string,
  messageId: string,
  pattern?: string,
  listId?: string,
  listMessageId?: string,
  props?: { [key: string]: any }
): Promise<void> => {
  await messagesV3.create(
    tenantId,
    eventId,
    recipientId,
    messageId,
    pattern,
    listId,
    listMessageId,
    props
  );
};

export const incrementErrorCount = async (
  tenantId: string,
  messageId: string,
  increment: number = 1
): Promise<void> => {
  try {
    // attempt v3 update
    await messagesV3.incrementErrorCount(tenantId, messageId, increment);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.incrementErrorCount(tenantId, messageId, increment);
      return;
    }
    throw err;
  }
};

export const list = messagesV2.list;

export const markClicked = async (
  tenantId: string,
  messageId: string,
  timestamp: number
): Promise<void> => {
  try {
    // attempt v3 update
    await messagesV3.markClicked(tenantId, messageId, timestamp);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markClicked(tenantId, messageId, timestamp);
      return;
    }
    throw err;
  }
};

export const markOpened = async (
  tenantId: string,
  messageId: string,
  timestamp: number
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.markOpened(tenantId, messageId, timestamp);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markOpened(tenantId, messageId, timestamp);
      return;
    }
    throw err;
  }
};

export const markDelivered = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.markDelivered(
      tenantId,
      messageId,
      provider,
      configuration
    );
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markDelivered(
        tenantId,
        messageId,
        provider,
        configuration
      );
      return;
    }
    throw err;
  }
};

export const markArchived = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  await messagesV3.markArchived(tenantId, messageId);
};

export const markUnread = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.markUnread(tenantId, messageId);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markUnread(tenantId, messageId);
      return;
    }
    throw err;
  }
};

export const markRead = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.markRead(tenantId, messageId);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markRead(tenantId, messageId);
      return;
    }
    throw err;
  }
};

const updateSentStatus = async (tenantId: string, messageId: string) => {
  try {
    // attempt v3
    await messagesV3.updateSentStatus(tenantId, messageId);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.updateSentStatus(tenantId, messageId);
      return;
    }
    throw err;
  }
};

const updateSentExtraData = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
) => {
  try {
    // attempt v3
    await messagesV3.updateSentExtraData(
      tenantId,
      messageId,
      provider,
      configuration
    );
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.updateSentExtraData(
        tenantId,
        messageId,
        provider,
        configuration
      );
      return;
    }
    throw err;
  }
};

export const markSent = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
): Promise<void> => {
  await Promise.all([
    await updateSentExtraData(tenantId, messageId, provider, configuration),
    await updateSentStatus(tenantId, messageId),
  ]);
};

export const markSimulated = async (
  tenantId: string,
  messageId: string,
  provider: string,
  configuration: string
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.markSimulated(
      tenantId,
      messageId,
      provider,
      configuration
    );
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markSimulated(
        tenantId,
        messageId,
        provider,
        configuration
      );
      return;
    }
    throw err;
  }
};

export const markEmail = async (
  tenantId: string,
  messageId: string,
  email: string
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.markEmail(tenantId, messageId, email);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markEmail(tenantId, messageId, email);
      return;
    }
    throw err;
  }
};

const markUndeliverableCore = async (
  tenantId: string,
  messageId: string,
  payload: {
    configuration?: string;
    errorMessage?: string;
    provider?: string;
  } = {},
  acceptedStatuses: MessageHistoryType[]
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.markUndeliverableCore(
      tenantId,
      messageId,
      payload,
      acceptedStatuses
    );
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markUndeliverableCore(
        tenantId,
        messageId,
        payload,
        acceptedStatuses
      );
      return;
    }
    throw err;
  }
};

export const markUndeliverable = async (
  tenantId: string,
  messageId: string,
  payload: {
    configuration?: string;
    errorMessage?: string;
    provider?: string;
  } = {}
): Promise<void> =>
  markUndeliverableCore(tenantId, messageId, payload, [
    "SENT",
    "DELIVERED",
    "OPENED",
    "CLICKED",
  ]);

// Used to only mark a message that is going through
// the delivery status pipeline.
export const markUndeliverableFromDelivery = async (
  tenantId: string,
  messageId: string,
  payload: {
    configuration?: string;
    errorMessage?: string;
    provider?: string;
  } = {}
): Promise<void> =>
  markUndeliverableCore(tenantId, messageId, payload, [
    "DELIVERED",
    "OPENED",
    "CLICKED",
  ]);

export const markUnmapped = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.markUnmapped(tenantId, messageId);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.markUnmapped(tenantId, messageId);
      return;
    }
    throw err;
  }
};

export const markUnroutable = async (
  tenantId: string,
  messageId: string
): Promise<void> => {
  // unroutable was introduced after messagesV3 adoption
  await messagesV3.markUnroutable(tenantId, messageId);
};

export const setBilledUnits = async (
  tenantId: string,
  messageId: string,
  billedUnits: number
): Promise<void> => {
  await messagesV3.setBilledUnits(tenantId, messageId, billedUnits);
};

export const setNotificationId = async (
  tenantId: string,
  messageId: string,
  notificationId: string
): Promise<void> => {
  try {
    // attempt v3
    await messagesV3.setNotificationId(tenantId, messageId, notificationId);
  } catch (err) {
    // fallback to v2 update
    if (err instanceof MessageNotFoundError) {
      await messagesV2.setNotificationId(tenantId, messageId, notificationId);
      return;
    }
    throw err;
  }
};
