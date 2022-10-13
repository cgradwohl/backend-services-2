import deepExtend from "deep-extend";
import { BlockWire } from "~/types.api";
import generateSlateDocument from "./generate-slate-document";
import htmlToSlate from "./html-to-slate";

export const applyBlockOverrides = (
  blocks: BlockWire[],
  blockOverrides = {}
) => {
  return blocks.map((block) => {
    if (!blockOverrides[`block_${block.id}`] || block.type !== "text") {
      return block;
    }

    const overrideBlock = blockOverrides[`block_${block.id}`];

    try {
      const blockConfig = deepExtend(
        {},
        JSON.parse(block.config),
        overrideBlock.config
      );

      let blockContent = blockConfig.value;
      if (overrideBlock.content) {
        const sourceSlateDocument = generateSlateDocument(blockConfig.value);

        const overrideSlateDocument = generateSlateDocument(
          htmlToSlate(overrideBlock.content, sourceSlateDocument) as object
        );

        blockContent = overrideSlateDocument.toJSON();
      }

      return {
        ...block,
        config: JSON.stringify({
          ...blockConfig,
          value: blockContent,
        }),
      };
    } catch (ex) {
      return block;
    }
  });
};
