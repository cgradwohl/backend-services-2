import serializeHtml from "~/lib/serialize-html";
import { IListBlockConfig } from "~/types.api";

import { IListBlockSerializer, ISerializeListBlockHandlers } from "../../types";

export const renderHtmlBulletListChild: ISerializeListBlockHandlers["child"] = (
  {
    config: {
      child: { value },
    },
    scope,
  },
  linkHandler,
  index
) => {
  return `<li style="margin:0;padding:10px 0 0;text-align:left">
      ${serializeHtml(value, linkHandler, scope.replace)}
    </li>`;
};

export const renderHtmlBulletListChildren: ISerializeListBlockHandlers["childList"] = (
  children
) => {
  return [
    '<ul style="margin:0;padding:0 0 0 20px">',
    ...children,
    "</ul>",
  ].join("\n");
};

export const renderHtmlBulletListItem: ISerializeListBlockHandlers["item"] = (
  { children, config, scope },
  linkHandler,
  childContent,
  index
) => {
  const {
    top: { value },
  } = config as IListBlockConfig;

  if (!children) {
    return `<li style="margin:0;padding:${
      index === 0 ? "0" : "10px 0 0"
    };text-align:left">
        ${serializeHtml(value, linkHandler, scope.replace)}
      </li>`;
  }

  return [
    `<div style="${index !== 0 ? "padding-top:20px" : ""};text-align:left">`,
    serializeHtml(value, linkHandler, scope.replace),
    "</div>",
    childContent,
  ].join("\n");
};

export const renderHtmlBulletList: ISerializeListBlockHandlers["list"] = (
  items,
  hasChildren
) => {
  const content = !hasChildren
    ? ['<ul style="margin:0;padding-left:20px;">', ...items, "</ul>"]
    : items;

  return `
    <mj-section css-class="c--block c--block-list">
      <mj-column padding-top="0px">
        <mj-text>
            ${content.join("\n")}
        </mj-text>
      </mj-column>
    </mj-section>
  `;
};

const getHtmlBulletListSerializers: IListBlockSerializer = () => {
  return {
    child: renderHtmlBulletListChild,
    childList: renderHtmlBulletListChildren,
    item: renderHtmlBulletListItem,
    list: renderHtmlBulletList,
  };
};

export default getHtmlBulletListSerializers;
