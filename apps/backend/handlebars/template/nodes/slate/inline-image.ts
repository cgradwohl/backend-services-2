import { Inline } from "slate";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import getDataFromSlateNode from "../../slate/get-data-from-node";

const getHandlebarsFromSlateLinkNode = (node: Inline) => {
  const {
    altText,
    imageHref,
    imagePath,
    imageSrc,
    width,
    ...options
  } = getDataFromSlateNode(node);
  const params = {
    ...options,
    alt: getComplexHandlebarsParameter(altText),
    href: getComplexHandlebarsParameter(imageHref),
    src:
      getComplexHandlebarsParameter(imagePath) ||
      getComplexHandlebarsParameter(imageSrc),
    width: getComplexHandlebarsParameter(width),
  };

  const partial = getHandlebarsPartial("inline-image", {
    params,
  });

  return partial;
};

export default getHandlebarsFromSlateLinkNode;
