import { CHANNEL_DIRECT_MESSAGE, CLASS_SMS } from "~/lib/channel-taxonomy";

import { IProvider } from "../types";
import handles from "./handles";

const provider: IProvider = {
  handles,
  taxonomy: {
    channel: CHANNEL_DIRECT_MESSAGE,
    class: CLASS_SMS,
  },
};

export default provider;
