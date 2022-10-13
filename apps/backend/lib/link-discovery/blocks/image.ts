import { IImageBlockConfig } from "~/types.api";
import { IBlockComponentLinkDiscoveryHandler } from ".";

const imageBlockComponentLinkDiscovery: IBlockComponentLinkDiscoveryHandler = block => {
  const { config: blockConfig, links, scope } = block;
  const imageBlockConfig = blockConfig as IImageBlockConfig;
  const { imageHref } = imageBlockConfig;

  if (imageHref) {
    const altText = scope.replace(imageBlockConfig.altText);

    links.addLink("image", {
      href: scope.replace(imageHref),
      text: scope.replace(altText),
    });
  }
};

export default imageBlockComponentLinkDiscovery;
