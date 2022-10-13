import { eventArchived } from "./event-archived";
import { eventClick } from "./event-click";
import { eventFiltered } from "./event-filtered";
import { eventMapped } from "./event-mapped";
import { eventOpened } from "./event-opened";
import { eventRead } from "./event-read";
import { eventUnmapped } from "./event-unmapped";
import { eventUnread } from "./event-unread";
import { profileLoaded } from "./profile-loaded";
import { providerDelivered } from "./provider-delivered";
import { providerError } from "./provider-error";
import { providerSent } from "./provider-sent";
import { providerSimulated } from "./provider-simulated";
import { undeliverable } from "./undeliverable";
import { unroutable } from "./unroutable";

export default {
  "event:archived": eventArchived,
  "event:click": eventClick,
  "event:filtered": eventFiltered,
  "event:notificationId": eventMapped,
  "event:opened": eventOpened,
  "event:read": eventRead,
  "event:unmapped": eventUnmapped,
  "event:unread": eventUnread,
  "profile:loaded": profileLoaded,
  "provider:delivered": providerDelivered,
  "provider:error": providerError,
  "provider:sent": providerSent,
  "provider:simulated": providerSimulated,
  undeliverable,
  unroutable,
};
