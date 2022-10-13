import { IProviderRenderHandler } from "~/providers/types";
import renderBlocks from "./blocks";

const renderExpo: IProviderRenderHandler = (blocks, params) => {
  const { expoConfig = {}, variableHandler } = params;
  const { subtitle, title } = expoConfig;

  return {
    plain: renderBlocks(blocks, "plain").join("\n"),
    subtitle: subtitle ? variableHandler.replace(subtitle) : subtitle,
    title: title ? variableHandler.replace(title) : title,
  };
};

export default renderExpo;
