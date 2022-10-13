import { CHANNEL_PUSH } from "./../../lib/channel-taxonomy";

import { IProvider } from "../types";
import handles from "./handles";

const provider: IProvider = {
  handles,
  taxonomy: {
    channel: CHANNEL_PUSH,
  },
};

export default provider;
