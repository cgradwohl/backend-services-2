import cheerio from "cheerio";

import { renderTemplateContent } from "~/components/block-components/template";

import { IBlockComponentLinkDiscoveryHandler } from ".";

const templateBlockLinkDiscovery: IBlockComponentLinkDiscoveryHandler = (
  block,
  serializerType
): void => {
  if (serializerType !== "html") {
    return;
  }

  const templateLinks = block.links.getScopedHandler("template");

  const htmlContent = renderTemplateContent(block);

  const $ = cheerio.load(htmlContent);

  $("a").each((i, el) => {
    const href = $(el).attr("href") || "";

    if (!href) {
      return;
    }

    templateLinks.addLink(i, { href });
  });
};

export default templateBlockLinkDiscovery;
