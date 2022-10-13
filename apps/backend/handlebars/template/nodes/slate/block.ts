import { Block } from "slate";

import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import getDataFromSlateNode from "../../slate/get-data-from-node";

const getHandlebarsFromSlateBlock = (node: Block, children: string) => {
  switch (node.type) {
    case "code":
    case "paragraph":
    case "quote":
      const params = getDataFromSlateNode(node);

      return getHandlebarsPartial(`${node.type}-block`, {
        children,
        params,
      });

    case "line":
      return children;

    case "bullet-list":
    case "list-item":
      return getHandlebarsPartial(node.type, {
        children,
      });

    default:
      // unsupported node type
      return children;
  }
};

export default getHandlebarsFromSlateBlock;
