import { ContentMessage, Message } from "~/api/send/types";

export function isContentMessage(message: Message): message is ContentMessage {
  return "content" in message;
}
