import { IProviderRenderHandler } from "~/providers/types";
import renderBlocks from "./blocks";

const renderHtml: IProviderRenderHandler = (blocks) => {
  return {
    html: renderBlocks(blocks, "html").join(""),
  };
};

export default renderHtml;
