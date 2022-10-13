import { IListBlockItem } from "~/components/block-components/types";
import { ILinkHandler } from "~/lib/link-handler";
import renderColSpan from "~/lib/render/html-col-span";
import { IBlockRendererResponse } from "~/types.internal";

import { IListBlockItemChild, IListBlockSerializer } from "../../types";
import { getHasChildList, getHtmlListChildVariant } from "../../utils";
import { renderHtmlBulletListChild } from "../using-bullets";
import {
  renderHtmlImageListImageColumn,
  renderHtmlImageListTextColumn,
} from "./columns";
import getListStyleHandlers, {
  IHtmlImageListBulletChildStyles,
  IHtmlImageListChildStyles,
  IHtmlImageListTopStyles,
} from "./styles";

export const renderHtmlImageListChild = (
  item: IListBlockItemChild,
  linkHandler: ILinkHandler,
  styles: IHtmlImageListChildStyles
) => {
  const { textColSpan, rowStyle } = styles;

  const imageCol = renderHtmlImageListImageColumn(item, styles);
  const textCol = renderHtmlImageListTextColumn(item, linkHandler, {
    ...styles,
    textColSpan,
  });

  return `
    <tr${rowStyle}>
      ${imageCol}
      ${textCol}
    </tr>
  `;
};

export const renderHtmlImageListBulletChildList = (
  children: IBlockRendererResponse[],
  styles: IHtmlImageListBulletChildStyles
) => {
  const { colPadding, colSpan, rowStyle } = styles;
  const style = colPadding ? ` style="padding:${colPadding}"` : "";

  return [
    `<tr${rowStyle}>
      <td${renderColSpan(colSpan)}${style}>
        <ul style="margin:0;padding:0 0 0 20px">`,
    ...children,
    `    </ul>
      </td>
    </tr>`,
  ].join("\n");
};

const renderHtmlImageListItem = (
  item: IListBlockItem,
  linkHandler: ILinkHandler,
  childContent: IBlockRendererResponse,
  styles: IHtmlImageListTopStyles
) => {
  const { itemStyle, textColSpan, rowStyle } = styles;

  const imageCol = renderHtmlImageListImageColumn(item, styles);
  const textCol = renderHtmlImageListTextColumn(item, linkHandler, {
    ...styles,
    textColSpan,
  });

  return `
    <mj-section css-class="c--block c--block-list">
      <mj-column${itemStyle}>
        <mj-table padding="0px">
          <tr${rowStyle}>
            ${imageCol}
            ${textCol}
          </tr>
          ${childContent}
        </mj-table>
      </mj-column>
    </mj-section>
  `;
};

const renderHtmlImageList: IListBlockSerializer = (block) => {
  const styles = getListStyleHandlers(block.config);
  const hasChildren = getHasChildList(block.config);
  const childVariant = getHtmlListChildVariant(block.config);

  if (hasChildren && childVariant === "bullet") {
    return {
      child: renderHtmlBulletListChild,
      childList: (content) =>
        renderHtmlImageListBulletChildList(
          content,
          styles.itemChild() as IHtmlImageListBulletChildStyles
        ),
      item: (item, linkHandler, childContent, index, last) =>
        renderHtmlImageListItem(
          item,
          linkHandler,
          childContent,
          styles.item(index, last, hasChildren)
        ),
    };
  }

  return {
    child: (child, linkHandler, index, last) =>
      renderHtmlImageListChild(
        child,
        linkHandler,
        styles.itemChild(index, last) as IHtmlImageListChildStyles
      ),
    item: (item, linkHandler, childContent, index, last) =>
      renderHtmlImageListItem(
        item,
        linkHandler,
        childContent,
        styles.item(index, last, hasChildren)
      ),
  };
};

export default renderHtmlImageList;
