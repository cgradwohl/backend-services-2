import { Utils } from "handlebars";

import { ISerializableBlock } from "~/lib/blocks/serialize";
import { IActionBlockConfig } from "~/types.api";

const actionRendererHtml = (
  config: IActionBlockConfig,
  block: ISerializableBlock
) => {
  const { links, scope } = block;
  const { align = "center", style } = config;

  const href = links.getHref("action", scope.replace(config.href));
  const text = scope.replace(config.text);
  let backgroundColor = scope.replace(config.backgroundColor);

  if (backgroundColor && backgroundColor.includes("{brand.colors")) {
    backgroundColor = "#9D3789";
  }

  const action = (() => {
    if (style === "link") {
      return `
        <mj-text align="${align}">
          <a href="${Utils.escapeExpression(
            href
          )}" target="_blank">${Utils.escapeExpression(text)}</a>
        </mj-text>
      `;
    }

    return `
      <mj-button align="${align}" href="${Utils.escapeExpression(
      href
    )}" background-color="${backgroundColor}" border-radius="4px" font-size="14px" inner-padding="10px 20px" padding="0px">
        ${Utils.escapeExpression(text)}
      </mj-button>
    `;
  })();

  return `
    <mj-section css-class="c--block c--block-action">
      <mj-column padding="8px 0px">
        ${action}
      </mj-column>
    </mj-section>
  `;
};

export default actionRendererHtml;
