import { CHANNEL_EMAIL } from "~/lib/channel-taxonomy";

import { IProvider } from "../types";
import handles from "./handles";

const provider: IProvider = {
  handles,
  taxonomy: {
    channel: CHANNEL_EMAIL,
  },
};

export default provider;
