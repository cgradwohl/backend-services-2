import { Inline } from "slate";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import getDataFromSlateNode from "../../slate/get-data-from-node";

const getHandlebarsFromSlateLinkNode = (node: Inline, children: string) => {
  const { text, href, ...options } = getDataFromSlateNode(node);
  const params = {
    ...options,
    href: getComplexHandlebarsParameter(href),
  };

  return getHandlebarsPartial("link", {
    children: children || "",
    params,
  });
};

export default getHandlebarsFromSlateLinkNode;
