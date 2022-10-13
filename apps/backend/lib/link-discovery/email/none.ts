import { ISerializableBlock } from "~/lib/blocks/serialize";

import htmlLinkDiscovery from "../html";

const noneEmailTemplateLinkDiscovery = (blocks: ISerializableBlock[]) => {
  htmlLinkDiscovery(blocks);
};

export default noneEmailTemplateLinkDiscovery;
