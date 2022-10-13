import { Inline } from "slate";
import { IConditionalConfig } from "~/types.api";

import getHandlebarsFromSlateInlineImageNode from "./inline-image";
import getHandlebarsFromSlateLinkNode from "./link";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsBlockConditional from "../../generation/get-handlebars-block-conditional";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import getDataFromSlateNode from "../../slate/get-data-from-node";

const getHandlebarsFromSlateInline = (node: Inline, children: string) => {
  switch (node.type) {
    case "conditional": {
      const data = getDataFromSlateNode(node);
      return getHandlebarsBlockConditional(
        children,
        data as IConditionalConfig
      );
    }

    case "highlight": {
      const data = getDataFromSlateNode(node);

      return getHandlebarsPartial("highlight", {
        children,
        params: {
          ...data,
          color: getComplexHandlebarsParameter(data.color),
        },
      });
    }

    case "textColor": {
      const data = getDataFromSlateNode(node);

      return getHandlebarsPartial("text-color", {
        children,
        params: {
          ...data,
          color: getComplexHandlebarsParameter(data.color),
        },
      });
    }

    case "image":
      return getHandlebarsFromSlateInlineImageNode(node);
    case "link":
      return getHandlebarsFromSlateLinkNode(node, children.trim());
    case "variable":
      return children;
    default:
      // unsupported node type
      return children;
  }
};

export default getHandlebarsFromSlateInline;
