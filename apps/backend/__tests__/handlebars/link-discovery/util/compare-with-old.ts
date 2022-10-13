import { TemplateConfig } from "~/handlebars/template/types";
import filterBlock from "~/lib/blocks/filter-block";
import serializeBlocks from "~/lib/blocks/serialize";
import blockLinkDiscovery from "~/lib/link-discovery/blocks";
import lineEmailTemplateLinkDiscovery from "~/lib/link-discovery/email/line";
import noneEmailTemplateLinkDiscovery from "~/lib/link-discovery/email/none";
import mdLinkDiscovery from "~/lib/link-discovery/md";
import plainLinkDiscovery from "~/lib/link-discovery/plain";
import createLinkHandler, { ILinkData } from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { Block } from "~/types.api";

const compareLinksWithOld = (
  renderer: "email" | "markdown" | "plain" | "slack",
  blocks: Block[],
  data: any,
  links: { [context: string]: ILinkData },
  config?: TemplateConfig
) => {
  const oldLinks: { [context: string]: ILinkData } = {};
  const variableHandler = createVariableHandler({ value: data }).getScoped(
    "data"
  );
  const linkHandler = createLinkHandler(oldLinks, true, true);

  const filtered = blocks.filter((block) =>
    filterBlock(block, variableHandler)
  );
  const serialized = serializeBlocks(filtered, linkHandler, variableHandler);

  switch (renderer) {
    case "email": {
      const templateName = config?.brand?.email?.templateOverride?.enabled
        ? config.brand.email.templateOverride.mjml?.enabled
          ? "mjml"
          : "custom"
        : config?.email?.emailTemplateConfig?.templateName || "none";

      switch (templateName) {
        case "line":
          lineEmailTemplateLinkDiscovery(
            serialized,
            config?.email?.emailTemplateConfig,
            linkHandler,
            variableHandler
          );
          break;
        default:
          noneEmailTemplateLinkDiscovery(serialized);
          break;
      }
      break;
    }
    case "markdown":
      mdLinkDiscovery(serialized);
      break;
    case "plain":
      plainLinkDiscovery(serialized);
      break;
    case "slack":
      const slackBlockLinkDiscovery = blockLinkDiscovery("slack");
      serialized.map(slackBlockLinkDiscovery);
      break;
  }

  // remove render artifacts
  const preRenderLinkData = Object.values(links).reduce(
    (acc: { [context: string]: ILinkData }, link) => {
      const { renderCount, trackingHref, trackingId, ...preRenderData } = link;
      acc[link.context] = preRenderData;
      return acc;
    },
    {}
  );

  expect(preRenderLinkData).toEqual(oldLinks);
};

export default compareLinksWithOld;
