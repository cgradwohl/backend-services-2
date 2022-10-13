import { CHANNEL_DIRECT_MESSAGE, CLASS_SMS } from "~/lib/channel-taxonomy";
import handles from "~/providers/messagemedia/handles";
import { IProvider } from "~/providers/types";

const provider: IProvider = {
  handles,
  taxonomy: {
    channel: CHANNEL_DIRECT_MESSAGE,
    class: CLASS_SMS,
  },
};

export default provider;
