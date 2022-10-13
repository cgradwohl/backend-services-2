import { IProviderRenderHandler } from "~/providers/types";

import renderBlocks from "./blocks";

const renderPlain: IProviderRenderHandler = (blocks) => {
  return {
    plain: renderBlocks(blocks, "plain").join("\n\n"),
  };
};

export default renderPlain;
