import { ISendMessageContext } from "~/send/types";
import { INotificationWire } from "~/types.api";

function isNotificationWire(
  payload: ISendMessageContext["content"]
): payload is INotificationWire {
  return (payload as INotificationWire).objtype !== undefined;
}

export default isNotificationWire;
