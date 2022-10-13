import { Value } from "slate";

import * as blockComponents from "~/components/block-components";
import { IListBlock } from "~/components/block-components/types";
import { ISerializableBlock } from "~/lib/blocks/serialize";
import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import { SerializerType } from "~/types.internal";

export type Serializer = (
  value: Value | undefined,
  linkHandler: ILinkHandler,
  variableReplacer: IVariableHandler["replace"],
  serializerType?: string
) => string;

const renderBlocks = (
  blocks: ISerializableBlock[],
  serializerType: SerializerType
): any[] => {
  if (!blocks.length) {
    return [];
  }

  const renderedBlocks = blocks
    .reduce((acc, unscopedBlock) => {
      const block = {
        ...unscopedBlock,
        links: unscopedBlock.links.getPrefixedHandler(serializerType),
      };

      switch (block.type) {
        case "action":
          return [...acc, blockComponents.action(block, serializerType)];
        case "divider":
          return [...acc, blockComponents.divider(block, serializerType)];
        case "image":
          return [...acc, blockComponents.image(block, serializerType)];
        case "jsonnet":
          const jsonnetResult = blockComponents.jsonnet(block, serializerType);
          if (Array.isArray(jsonnetResult)) {
            return [...acc, ...jsonnetResult];
          }

          return [...acc, jsonnetResult];
        case "list":
          return [
            ...acc,
            blockComponents.list(block as IListBlock, serializerType),
          ];
        case "markdown":
          return [...acc, blockComponents.markdown(block, serializerType)];
        case "quote":
          return [...acc, blockComponents.quote(block, serializerType)];
        case "template":
          return [...acc, blockComponents.template(block, serializerType)];

        case "text":
        case "line":
        default:
          return [...acc, blockComponents.text(block, serializerType)];
      }
    }, [])
    .filter(Boolean);

  return renderedBlocks;
};

export interface ISerializableObject {
  object: string;
  key: string;
  type: string;
  data: Map<string, string>;
  text: string;
}

export default renderBlocks;
