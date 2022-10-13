import { IImageBlock } from "~/types.api";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";

const getHandlebarsFromImageBlock = (block: IImageBlock): string => {
  const {
    align,
    altText,
    conditional,
    imageHref,
    imagePath,
    imageSrc, // not used??? Frontend will populate path with the src if used
    width = "300px",
    ...options
  } = block.config;

  const params = {
    ...options,
    align: align !== "full" ? align : undefined,
    alt: getComplexHandlebarsParameter(altText),
    href: getComplexHandlebarsParameter(imageHref),
    src: getComplexHandlebarsParameter(imagePath),
    width,
  };

  return getHandlebarsPartial("image-block", { params });
};

export default getHandlebarsFromImageBlock;
