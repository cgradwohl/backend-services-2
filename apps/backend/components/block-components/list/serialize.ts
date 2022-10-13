import { IListBlock, ISerializeListBlockHandlers } from "./types";
import { getHasChildList } from "./utils";

const serializeList = (
  block: IListBlock,
  serializeHandlers: ISerializeListBlockHandlers
) => {
  const hasChildren = getHasChildList(block.config);
  const linkHandler = block.links;

  const lastItemIndex = block.children.length - 1;
  const items = block.children.map((item, itemIndex) => {
    const lastChildIndex = hasChildren ? item.children.length - 1 : 0;
    const itemLinkHandler = linkHandler
      .getScopedHandler("item")
      .getScopedHandler(itemIndex);

    const children =
      hasChildren && item.children
        ? item.children.map((child, childIndex) => {
            const childLinkHandler = itemLinkHandler
              .getScopedHandler("child-item")
              .getScopedHandler(childIndex);

            return serializeHandlers.child(
              child,
              childLinkHandler,
              childIndex,
              lastChildIndex
            );
          })
        : [];

    const childContent =
      children.length && serializeHandlers.childList
        ? serializeHandlers.childList(children)
        : children.join("");

    return serializeHandlers.item(
      item,
      itemLinkHandler,
      childContent,
      itemIndex,
      lastItemIndex
    );
  });

  const list =
    items.length && serializeHandlers.list
      ? serializeHandlers.list(items, hasChildren)
      : items.join("");

  return list;
};

export default serializeList;
