import { IProviderRenderHandler } from "~/providers/types";
import renderBlocks from "./blocks";

const renderAirship: IProviderRenderHandler = (blocks, params) => {
  const { airshipConfig = {}, variableHandler } = params;
  const { title } = airshipConfig;

  return {
    plain: renderBlocks(blocks, "plain").join(""),
    title: title ? variableHandler.replace(title) : title,
  };
};

export default renderAirship;
