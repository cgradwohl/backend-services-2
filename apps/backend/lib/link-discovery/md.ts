import { ISerializableBlock } from "~/lib/blocks/serialize";

import blockLinkDiscovery from "./blocks";

const mdBlockLinkDiscovery = blockLinkDiscovery("md");

const mdLinkDiscovery = (blocks: ISerializableBlock[]) =>
  blocks.map(mdBlockLinkDiscovery);

export default mdLinkDiscovery;
