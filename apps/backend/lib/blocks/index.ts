import { UTM } from "~/api/send/types";
import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import { augmentBlockHref } from "~/send/worker/provider-render/augment-href";
import { BlockWire } from "~/types.api";

import filterBlock from "./filter-block";
import hydrateBlock from "./hydrate-slate-block";
import serializeBlocks from "./serialize";

const getBlocks = (
  wireBlocks: BlockWire[],
  linkHandler: ILinkHandler,
  variableHandler: IVariableHandler,
  utm?: UTM
) => {
  const blocks = wireBlocks.map((block) => hydrateBlock(block));

  const filteredBlocks = blocks.filter((block) =>
    filterBlock(block, variableHandler)
  );

  const serializedBlocks = serializeBlocks(
    filteredBlocks,
    linkHandler,
    variableHandler
  );

  augmentBlockHref({
    ir: serializedBlocks,
    utm,
  });

  return serializedBlocks;
};

export default getBlocks;
