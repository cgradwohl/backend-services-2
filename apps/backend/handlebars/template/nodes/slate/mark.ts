import { Mark } from "slate";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import getDataFromSlateNode from "../../slate/get-data-from-node";

const getHandlebarsFromSlateMark = (node: Mark, children: string) => {
  switch (node.type) {
    case "bold":
    case "italic":
    case "strikethrough":
    case "underlined":
      // basic marks that we can generate a basic partial for
      return getHandlebarsPartial(node.type, { children, params: {} });
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
    default:
      // unexpected mark, ghost it
      return children;
  }
};

export default getHandlebarsFromSlateMark;
