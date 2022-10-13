import { ISerializableBlock } from "~/lib/blocks/serialize";

import blockLinkDiscovery from "./blocks";
import plainLinkDiscovery from "./plain";

const slackBlockLinkDiscovery = blockLinkDiscovery("slack");

const slackLinkDiscovery = (blocks: ISerializableBlock[]) => {
  blocks.map(slackBlockLinkDiscovery);
  plainLinkDiscovery(blocks.filter(({ type }) => type !== "action"));
};

export default slackLinkDiscovery;
