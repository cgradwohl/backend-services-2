import { BlockWire } from "~/types.api";

const getBlocksFromIds = (
  allBlocks: BlockWire[],
  channelBlockIds: string[]
): BlockWire[] => {
  if (
    !channelBlockIds ||
    !channelBlockIds.length ||
    !allBlocks ||
    !allBlocks.length
  ) {
    return [];
  }
  return channelBlockIds
    .map(id => {
      return allBlocks.find(b => b.id === id);
    })
    .filter(block => Boolean(block));
};

export default getBlocksFromIds;
