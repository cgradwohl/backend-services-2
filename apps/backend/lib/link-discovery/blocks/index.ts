import { ISerializableBlock } from "~/lib/blocks/serialize";
import { BlockType } from "~/types.api";
import { SerializerType } from "~/types.internal";

import action from "./action";
import divider from "./divider";
import image from "./image";
import jsonnet from "./jsonnet";
import list from "./list";
import markdown from "./markdown";
import quote from "./quote";
import template from "./template";
import text from "./text";
import column from "./column";

export type IBlockComponentLinkDiscoveryHandler = (
  block: ISerializableBlock,
  serializeType: SerializerType
) => void;

const linkDiscoveryComponents: {
  [block in BlockType]: IBlockComponentLinkDiscoveryHandler;
} = {
  action,
  divider,
  image,
  line: text,
  list,
  markdown,
  quote,
  template,
  text,
  jsonnet,
  column,
};

const blockLinkDiscovery = (serializeType: SerializerType) => {
  return (block: ISerializableBlock) => {
    const scopedBlock: ISerializableBlock = {
      ...block,
      links: block.links.getPrefixedHandler(serializeType),
    };

    const blockComponent =
      linkDiscoveryComponents[block.type] || linkDiscoveryComponents.text;

    return blockComponent(scopedBlock, serializeType);
  };
};

export default blockLinkDiscovery;
