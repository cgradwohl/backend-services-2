import { Utils } from "handlebars";

import { IImageBlockConfig } from "../../types.api";
import { IBlockRenderer, ISlackImageBlock } from "../../types.internal";

const imageRenderer: IBlockRenderer = (block, serializerType) => {
  const { scope: variables, config: blockConfig, links: linkHandler } = block;
  const imageBlockConfig = blockConfig as IImageBlockConfig;
  const {
    align = "full",
    altText = "",
    imageHref = "",
    imagePath,
    width = "300px",
  } = imageBlockConfig;

  const href = imageHref
    ? linkHandler.getHref("image", variables.replace(imageHref))
    : undefined;
  const text = Utils.escapeExpression(variables.replace(altText)) || "";
  const path = Utils.escapeExpression(variables.replace(imagePath));

  if (serializerType === "slack") {
    const slackBlock: ISlackImageBlock = {
      // slack requires alt text length > 0
      alt_text: text || " ",
      image_url: path,
      type: "image",
    };

    return slackBlock;
  }

  if (serializerType === "md") {
    if (!href) {
      return `[![${text}](${path})]`;
    }

    return `[![${text}](${path})](${href})`;
  }

  if (serializerType === "plain") {
    return path;
  }

  if (!path) {
    return "";
  }

  return `
    <mj-section css-class="c--block c--block-image">
      <mj-column padding="10px 0px">
        <mj-image ${
          align !== "full" ? `width="${width}" align="${align}" ` : ""
        }src="${path}" alt="${text}" ${href ? `href="${href}"` : ``} />
      </mj-column>
    </mj-section>
  `;
};

export default imageRenderer;
