import { IProviderRenderHandler } from "~/providers/types";
import renderBlocks from "./blocks";

const renderFirebaseFcm: IProviderRenderHandler = (blocks, params) => {
  const { firebaseFcmConfig = { title: undefined }, variableHandler } = params;
  const { title } = firebaseFcmConfig;

  return {
    plain: renderBlocks(blocks, "plain").join("\n"),
    title: title ? variableHandler.replace(title) : title,
  };
};

export default renderFirebaseFcm;
