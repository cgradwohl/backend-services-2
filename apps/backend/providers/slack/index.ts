import { CHANNEL_DIRECT_MESSAGE } from "~/lib/channel-taxonomy";

import { IProvider } from "../types";
import getReference from "./get-reference";
import handles from "./handles";

const provider: IProvider = {
  deliveryStatusStrategy: "DELIVER_IMMEDIATELY",
  getReference,
  handles,
  taxonomy: {
    channel: CHANNEL_DIRECT_MESSAGE,
  },
};

export default provider;
