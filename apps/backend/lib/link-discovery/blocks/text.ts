import slateLinkDiscoverySerializer from "~/lib/link-discovery/slate-serializer";
import { ITextBlockConfig } from "~/types.api";

import { IBlockComponentLinkDiscoveryHandler } from ".";

const textBlockComponentLinkDiscovery: IBlockComponentLinkDiscoveryHandler = (
  block,
  serializeType
) => {
  const { config, links, scope } = block;
  const { value } = config as ITextBlockConfig;

  slateLinkDiscoverySerializer(value, links, scope.replace, serializeType);
};

export default textBlockComponentLinkDiscovery;
