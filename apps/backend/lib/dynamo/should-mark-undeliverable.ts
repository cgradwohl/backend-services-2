// Do not mark undeliverable if recipient has message or interacted with it,
// or there exists at least one channel where its provider has SENT as a terminal state.

import { IMessageHistory, MessageHistoryType } from "../message-service/types";

export const shouldMarkUndeliverable = (
  messageHistory: Array<IMessageHistory<MessageHistoryType>>,
  acceptedStatuses: MessageHistoryType[]
) => {
  const recipientHasMessage = messageHistory.some(({ type }) =>
    acceptedStatuses.includes(type)
  );

  return !recipientHasMessage;
};
