import { CHANNEL_EMAIL } from "~/lib/channel-taxonomy";

import handles from "../lib/email/handles";
import { IProvider } from "../types";
import getDeliveredTimestamp from "./get-delivered-timestamp";
import getDeliveryStatus from "./get-delivery-status";
import getDeliveryStatusEnabled from "./get-delivery-status-enabled";
import getExternalId from "./get-external-id";
import getReference from "./get-reference";

const provider: IProvider = {
  deliveryStatusStrategy: "POLLING",
  getDeliveredTimestamp,
  getDeliveryStatus,
  getDeliveryStatusEnabled,
  getExternalId,
  getReference,
  handles,
  taxonomy: {
    channel: CHANNEL_EMAIL,
  },
};

export default provider;
