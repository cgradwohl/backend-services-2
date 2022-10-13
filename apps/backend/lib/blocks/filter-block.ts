import shouldFiter from "~/lib/conditional-filter";
import { Block } from "~/types.api";
import { IVariableHandler } from "../variable-handler";

const filterBlock = (block: Block, scope: IVariableHandler) => {
  if (!block || !block.config) {
    return false;
  }

  const {
    config: { conditional },
  } = block;

  if (!conditional || !conditional.filters || !conditional.filters.length) {
    return true;
  }

  return !shouldFiter(scope, conditional);
};

export default filterBlock;
