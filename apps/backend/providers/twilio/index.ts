import { CHANNEL_DIRECT_MESSAGE, CLASS_SMS } from "~/lib/channel-taxonomy";

import { IProvider } from "../types";
import getDeliveredTimestamp from "./get-delivered-timestamp";
import getDeliveryStatus from "./get-delivery-status";
import getDeliveryStatusEnabled from "./get-delivery-status-enabled";
import getExternalId from "./get-external-id";
import getReference from "./get-reference";
import handles from "./handles";

const provider: IProvider = {
  deliveryStatusStrategy: "POLLING",
  getDeliveredTimestamp,
  getDeliveryStatus,
  getDeliveryStatusEnabled,
  getExternalId,
  getReference,
  handles,
  taxonomy: {
    channel: CHANNEL_DIRECT_MESSAGE,
    class: CLASS_SMS,
  },
};

export default provider;
