import { ILinkHandler } from "~/lib/link-handler";
import serializeMd from "~/lib/serialize-md";
import { IBlockRendererResponse, SerializerType } from "~/types.internal";

import { IListBlockItem, IListBlockSerializer } from "./types";

export const renderListBlockMarkdownItemChild = (
  {
    scope,
    config: {
      child: { value },
    },
  },
  linkHandler: ILinkHandler,
  serializerType: SerializerType
): string => {
  return serializeMd(value, linkHandler, scope.replace, serializerType);
};

export const renderListBlockMarkdownItemChildren = children => {
  return children.map(item => `\n+ ${item}`).join("");
};

export const renderListBlockMarkdownItem = (
  {
    scope,
    config: {
      top: { value },
    },
  }: IListBlockItem,
  linkHandler: ILinkHandler,
  childContent: IBlockRendererResponse,
  serializerType: SerializerType
): IBlockRendererResponse => {
  return (
    serializeMd(value, linkHandler, scope.replace, serializerType) +
    childContent
  );
};

export const renderListBlockMarkdown = (
  content,
  hasChildList,
  serializerType: SerializerType
) => {
  const listBullet = serializerType === "slack" ? "•" : "+";
  const listItems = hasChildList
    ? content
    : content.map(item => `${listBullet} ${item}`);
  const text = listItems.join(hasChildList ? "\n\n" : "\n");

  if (!text) {
    return;
  }

  if (serializerType === "slack") {
    return {
      text: {
        text,
        type: "mrkdwn",
      },
      type: "section",
    };
  }
  return text;
};

const getListBlockMarkdownSerializer: IListBlockSerializer = () => {
  return {
    child: (item, linkHandler) =>
      renderListBlockMarkdownItemChild(item, linkHandler, "md"),
    childList: renderListBlockMarkdownItemChildren,
    item: (item, linkHandler, childContent) =>
      renderListBlockMarkdownItem(item, linkHandler, childContent, "md"),
    list: (content, hasChildren) =>
      renderListBlockMarkdown(content, hasChildren, "md"),
  };
};

export default getListBlockMarkdownSerializer;
