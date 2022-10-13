import { ISerializableBlock } from "~/lib/blocks/serialize";

import blockLinkDiscovery from "./blocks";

const htmlBlockLinkDiscovery = blockLinkDiscovery("html");

const htmlLinkDiscovery = (blocks: ISerializableBlock[]) => {
  return blocks.map(htmlBlockLinkDiscovery);
};

export default htmlLinkDiscovery;
