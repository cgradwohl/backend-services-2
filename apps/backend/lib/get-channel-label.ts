import { IChannel } from "~/types.api";
import { ChannelDetails } from "~/types.internal";
import parseTaxonomy from "./parse-taxonomy";

const getChannelLabel = (channel: IChannel | ChannelDetails) => {
  if (channel.label?.trim()?.length) {
    return channel.label;
  }

  const { channel: ch, class: cl } = parseTaxonomy(channel.taxonomy);

  if (cl === "sms") {
    return cl;
  }

  if (ch === "push") {
    return `${ch}-${cl}`;
  }

  return ch;
};

export default getChannelLabel;
