import { IListBlockSerializer } from "../types";
import { getHtmlListVariant } from "../utils";
import renderHtmlBulletList from "./using-bullets";
import renderHtmlImageList from "./using-images";

const renderHtmlList: IListBlockSerializer = (block) => {
  const variant = getHtmlListVariant(block.config);
  block.config.top.background = block.config.top.background
    ? block.scope.replace(block.config.top.background)
    : block.config.top.background;

  if (
    block.config.top.background &&
    block.config.top.background.includes("{brand.colors")
  ) {
    block.config.top.background = "transparent";
  }

  switch (variant) {
    case "bullet":
      return renderHtmlBulletList(block);
    case "images":
      return renderHtmlImageList(block);
    default:
      const exhaustiveCheck: never = variant;
      throw new Error(`Unexpected variant: ${exhaustiveCheck}`);
  }
};

export default renderHtmlList;
