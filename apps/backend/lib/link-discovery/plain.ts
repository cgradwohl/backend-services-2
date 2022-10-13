import { ISerializableBlock } from "~/lib/blocks/serialize";

import blockLinkDiscovery from "./blocks";

const plainBlockLinkDiscovery = blockLinkDiscovery("plain");

const plainLinkDiscovery = (blocks: ISerializableBlock[]) => {
  return blocks.map(plainBlockLinkDiscovery);
};

export default plainLinkDiscovery;
