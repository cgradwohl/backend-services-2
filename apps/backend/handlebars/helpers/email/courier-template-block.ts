import $ from "cheerio";
import { HelperOptions } from "handlebars";
import juice from "juice";

import getHandlebarsLinkHandler from "../utils/get-link-handler";

function courierTemplateBlockHandlebarsTemplate(
  this: any,
  options: HelperOptions
) {
  const html = juice(options.fn(this));

  const $wrap = $(
    "section#courier-template-block-wrapper",
    `<section id="courier-template-block-wrapper">${html}</div>`
  );
  const $links = $wrap.find("a");

  if (!$links.length) {
    return html;
  }

  const linkHandler = getHandlebarsLinkHandler(options).getScopedHandler(
    "template"
  );

  $links.each((i, link) => {
    const $link = $(link);
    const href = $link.attr("href") || "";

    if (!href) {
      return;
    }

    const trackingHref = linkHandler.handleHref({ href }, i);
    $link.attr("href", trackingHref);
  });

  return $wrap.html();
}

export default courierTemplateBlockHandlebarsTemplate;
