import { IProviderRenderHandler } from "~/providers/types";

import renderBlocks from "./blocks";

const renderMarkdown: IProviderRenderHandler = (blocks) => {
  return {
    md: renderBlocks(blocks, "md").join("\n\n"),
  };
};

export default renderMarkdown;
