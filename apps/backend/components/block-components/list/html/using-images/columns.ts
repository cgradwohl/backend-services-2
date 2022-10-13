import { Utils } from "handlebars";

import { IListBlockItem } from "~/components/block-components/types";
import { ILinkHandler } from "~/lib/link-handler";
import renderColSpan from "~/lib/render/html-col-span";
import renderOptionalLink from "~/lib/render/html-optional-link";
import serializeHtml from "~/lib/serialize-html";
import { IListBlockItemChild } from "../../types";

export interface IHtmlImageListImageColumnStyles {
  imageColPadding: string;
  imageWidth: number;
}

export interface IHtmlImageListTextColumnStyles {
  textColSpan: number;
  textColPadding: string;
  textColWidth: number;
}

export type IHtmlImageListColumnStyles = IHtmlImageListImageColumnStyles &
  IHtmlImageListTextColumnStyles;

export const renderHtmlImageListImageColumn = (
  item: IListBlockItem | IListBlockItemChild,
  styles: IHtmlImageListImageColumnStyles
) => {
  const { scope: childVariables, config } = item;
  const { imageHref, imagePath } = config[item.type];
  const { imageColPadding, imageWidth } = styles;

  const src = childVariables.replace(imagePath);
  const href = childVariables.replace(imageHref);

  if (!src) {
    return "";
  }

  return `<td
    style="padding:${imageColPadding}"
    width="${imageWidth}px"
  >
    ${renderOptionalLink(
      { href },
      `<img src="${Utils.escapeExpression(
        src
      )}" width="${imageWidth}px" height="${imageWidth}px" />`
    )}
  </td>`;
};

export const renderHtmlImageListTextColumn = (
  item: IListBlockItem | IListBlockItemChild,
  linkHandler: ILinkHandler,
  styles: IHtmlImageListTextColumnStyles
) => {
  const { config, scope: childVariables } = item;
  const { value } = config[item.type];
  const { textColPadding, textColSpan, textColWidth } = styles;

  return `<td${renderColSpan(textColSpan)}
      style="padding:${textColPadding};text-align:left"
      width="${textColWidth}px"
    >
      ${serializeHtml(value, linkHandler, childVariables.replace)}
    </td>`;
};
