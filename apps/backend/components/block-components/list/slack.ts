import {
  renderListBlockMarkdownItem,
  renderListBlockMarkdownItemChild,
} from "./md";
import { IListBlockSerializer, ISerializeListBlockHandlers } from "./types";

export const renderListBlockSlackItemChildren: ISerializeListBlockHandlers["childList"] = children => {
  return children.map(item => `\n• ${item}`).join("");
};

const renderSlackListBlock: ISerializeListBlockHandlers["list"] = (
  content,
  hasChildList
) => {
  const listItems = hasChildList ? content : content.map(item => `• ${item}`);
  const text = listItems.join(hasChildList ? "\n\n" : "\n");

  if (!text) {
    return;
  }

  return {
    text: {
      text,
      type: "mrkdwn",
    },
    type: "section",
  };
};

const getListBlockSlackSerializer: IListBlockSerializer = block => {
  return {
    child: (item, linkHandler) =>
      renderListBlockMarkdownItemChild(item, linkHandler, "slack"),
    childList: renderListBlockSlackItemChildren,
    item: (item, linkHandler, childContent) =>
      renderListBlockMarkdownItem(item, linkHandler, childContent, "slack"),
    list: (content, hasChildren) => renderSlackListBlock(content, hasChildren),
  };
};

export default getListBlockSlackSerializer;
