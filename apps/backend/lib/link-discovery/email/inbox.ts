import { ISerializableBlock } from "~/lib/blocks/serialize";

import htmlLinkDiscovery from "../html";

const inboxEmailTemplateLinkDiscovery = (blocks: ISerializableBlock[]) => {
  htmlLinkDiscovery(blocks);
};

export default inboxEmailTemplateLinkDiscovery;
