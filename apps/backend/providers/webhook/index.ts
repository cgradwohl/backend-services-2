import { CHANNEL_WEBHOOK } from "~/lib/channel-taxonomy";

import { IProvider } from "../types";
import handles from "./handles";

const provider: IProvider = {
  deliveryStatusStrategy: "DELIVER_IMMEDIATELY",
  handles,
  taxonomy: {
    channel: CHANNEL_WEBHOOK,
  },
};

export default provider;
