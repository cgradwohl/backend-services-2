import { IActionBlockConfig } from "~/types.api";
import { IBlockRenderer } from "~/types.internal";

import actionRendererHtml from "./html";
import actionRendererMd from "./md";
import actionRendererPlain from "./plain";
import actionRendererSlack from "./slack";

const actionRenderer: IBlockRenderer = (block, serializerType) => {
  const { config: blockConfig } = block;
  const actionBlockConfig = blockConfig as IActionBlockConfig;
  const { text } = actionBlockConfig;

  if (!text) {
    return;
  }

  switch (serializerType) {
    case "md":
      return actionRendererMd(actionBlockConfig, block);
    case "plain":
      return actionRendererPlain(actionBlockConfig, block);
    case "slack":
      return actionRendererSlack(actionBlockConfig, block);
    case "html":
      return actionRendererHtml(actionBlockConfig, block);
    default:
      const exhaustiveCheck: never = serializerType;
      throw new Error(`Unexpected serializerType [${exhaustiveCheck}]`);
  }
};

export default actionRenderer;
