import slateLinkDiscoverySerializer from "~/lib/link-discovery/slate-serializer";
import { IQuoteBlockConfig } from "~/types.api";

import { IBlockComponentLinkDiscoveryHandler } from ".";

const quoteBlockComponentLinkDiscovery: IBlockComponentLinkDiscoveryHandler = (
  block,
  serializeType
) => {
  const { config, links, scope } = block;
  const { value } = config as IQuoteBlockConfig;

  slateLinkDiscoverySerializer(value, links, scope.replace, serializeType);
};

export default quoteBlockComponentLinkDiscovery;
