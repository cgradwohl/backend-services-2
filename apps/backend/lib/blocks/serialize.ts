import * as blockComponents from "~/components/block-components";
import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import { Block, BlockType } from "~/types.api";

export interface ISerializableBlock {
  config: any;
  id: string;
  links: ILinkHandler;
  scope: IVariableHandler;
  type: BlockType;
  partials?: {
    [snippetName: string]: string;
  };
}

const serializeBlocks = (
  blocks: Block[],
  linkHandler: ILinkHandler,
  scope: IVariableHandler
) => {
  return blocks.reduce((result: ISerializableBlock[], block: Block) => {
    let serializedBlock: ISerializableBlock = {
      ...block,
      links: linkHandler.getScopedHandler(block.id),
      scope,
    };

    if (block.type === "list") {
      serializedBlock = blockComponents.prepareList(serializedBlock);

      if (!serializedBlock) {
        return result;
      }
    }

    result.push(serializedBlock);
    return result;
  }, []);
};

export default serializeBlocks;
