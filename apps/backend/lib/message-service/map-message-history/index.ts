import { IMessageHistory, MessageHistoryType } from "../types";
import clicked from "./clicked";
import delivered from "./delivered";
import delivering from "./delivering";
import enqueued from "./enqueued";
import filtered from "./filtered";
import mapped from "./mapped";
import opened from "./opened";
import profileLoaded from "./profile-loaded";
import providerError from "./provider-error";
import rendered from "./rendered";
import sent from "./sent";
import { MapFn, MappableEventLogEntry } from "./types";
import undeliverable from "./undeliverable";
import unmapped from "./unmapped";
import unroutable from "./unroutable";

const map: MapFn<MappableEventLogEntry, IMessageHistory<MessageHistoryType>> = (
  log
) => {
  switch (log.type) {
    case "event:click":
      return clicked(log);
    case "event:filtered":
      return filtered(log);
    case "event:notificationId":
      return mapped(log);
    case "event:opened":
      return opened(log);
    case "event:received":
      return enqueued(log);
    case "event:unmapped":
      return unmapped(log);
    case "profile:loaded":
      return profileLoaded(log);
    case "provider:delivered":
      return delivered(log);
    case "provider:delivering":
      return delivering(log);
    case "provider:error":
      return providerError(log);
    case "provider:rendered":
      return rendered(log);
    case "provider:sent":
      return sent(log);
    case "unroutable":
      return unroutable(log);
    case "undeliverable":
      return undeliverable(log);
  }
};

export default map;
