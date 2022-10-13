import { CHANNEL_DIRECT_MESSAGE } from "~/lib/channel-taxonomy";

import { IProvider } from "../types";
import handles from "./handles";

const provider: IProvider = {
  handles,
  taxonomy: {
    channel: CHANNEL_DIRECT_MESSAGE,
  },
};

export default provider;
