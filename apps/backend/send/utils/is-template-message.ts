import { Message, TemplateMessage } from "~/api/send/types";

export function isTemplateMessage(
  message: Message
): message is TemplateMessage {
  return "template" in message;
}
