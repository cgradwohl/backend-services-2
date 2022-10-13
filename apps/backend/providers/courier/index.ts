import {
  CHANNEL_PUSH,
  CHANNEL_INBOX,
  CHANNEL_BANNER,
} from "~/lib/channel-taxonomy";

import { IProvider } from "../types";
import handles from "./handles";

const provider: IProvider = {
  handles,
  taxonomy: {
    channel: CHANNEL_PUSH,
    channels: [CHANNEL_PUSH, CHANNEL_INBOX, CHANNEL_BANNER],
  },
};

export default provider;
