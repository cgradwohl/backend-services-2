import { CHANNEL_EMAIL } from "~/lib/channel-taxonomy";

import handles from "../lib/email/handles";
import { IProvider } from "../types";

const provider: IProvider = {
  handles,
  taxonomy: {
    channel: CHANNEL_EMAIL,
  },
};

export default provider;
