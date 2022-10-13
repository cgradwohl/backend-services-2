import { Message } from "~/api/send/types";
import { createMd5Hash } from "~/lib/crypto-helpers";
import { isTemplateMessage } from "./is-template-message";

export const getEventId = (message: Message) => {
  if (isTemplateMessage(message)) {
    return message.template;
  } else {
    return (
      message.metadata?.event ??
      `inline_${createMd5Hash(JSON.stringify(message.content))}`
    );
  }
};
