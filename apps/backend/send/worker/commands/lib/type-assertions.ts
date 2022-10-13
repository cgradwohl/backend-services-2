import { Content } from "~/api/send/types";
import { INotificationWire } from "~/types.api";

// NOTE: Converted unknown to INotificationWire.
export function isINotificationWire(
  notification: INotificationWire | Content
): notification is INotificationWire {
  return (
    notification &&
    typeof notification === "object" &&
    "json" in notification &&
    "channels" in notification["json"] &&
    "blocks" in notification["json"]
  );
}
