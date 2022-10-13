import $ from "cheerio";
import handlebars from "handlebars";
import juice from "juice";

import courierHandlebarsHelpers from "~/handlebars/helpers";
import { ISerializableBlock } from "~/lib/blocks/serialize";
import log from "~/lib/log";
import { ITemplateBlockConfig } from "~/types.api";
import { IBlockRenderer } from "~/types.internal";

import getTextStyle from "../lib/text-styles";

export const renderTemplateContent = (block: ISerializableBlock): string => {
  const { config: blockConfig, scope } = block;
  const templateBlockConfig = blockConfig as ITemplateBlockConfig;

  handlebars.registerHelper("path", (path) => scope.resolve(path));
  const context = scope.resolve("@", [])[0];

  try {
    const compiledTemplate = handlebars.compile(templateBlockConfig.template);
    return juice(
      compiledTemplate(context, {
        data: {
          variableHandler: scope,
        },
        helpers: courierHandlebarsHelpers.universal,
        // TODO: HANDLEBARS: remove this when handlebars ships
        // @ts-ignore: type is transient and is forced up object in route and render-preview-email
        partials: block && block.partials ? block.partials : {},
      })
    );
  } catch (ex) {
    log("Template block render error:", ex);
    return `<div style="color: red">Error Rendering Block</div>`;
  }
};

const getClickThroughTrackingContent = (block: ISerializableBlock): string => {
  const html = renderTemplateContent(block);

  const $wrap = $(
    "section#courier-template-block-wrapper",
    `<section id="courier-template-block-wrapper">${html}</div>`
  );
  const $links = $wrap.find("a");

  if ($links.length === 0) {
    return html;
  }

  const templateLinks = block.links.getScopedHandler("template");

  $links.each((i, link) => {
    const $link = $(link);
    const href = $link.attr("href") || "";

    if (!href) {
      return;
    }

    const trackingHref = templateLinks.getHref(i, href);
    $link.attr("href", trackingHref);
  });

  return $wrap.html();
};

const templateRenderer: IBlockRenderer = (block, serializerType) => {
  if (serializerType !== "html") {
    return "";
  }

  const html = getClickThroughTrackingContent(block);

  return `
      <mj-section css-class="c--block c--block-template">
        <mj-column>
            <mj-text ${getTextStyle("text")} css-class="c--text-text">
                    ${html}
            </mj-text>
        </mj-column>
      </mj-section>
    `;
};

export default templateRenderer;
