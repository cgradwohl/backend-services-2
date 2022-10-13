import slateLinkDiscoverySerializer from "~/lib/link-discovery/slate-serializer";
import { IMarkdownBlockConfig } from "~/types.api";

import { IBlockComponentLinkDiscoveryHandler } from ".";

const markdownBlockComponentLinkDiscovery: IBlockComponentLinkDiscoveryHandler = (
  block,
  serializeType
) => {
  const { config, links, scope } = block;
  const { value } = config as IMarkdownBlockConfig;

  slateLinkDiscoverySerializer(value, links, scope.replace, serializeType);
};

export default markdownBlockComponentLinkDiscovery;
