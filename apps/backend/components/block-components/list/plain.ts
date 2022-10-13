import serializePlain from "~/lib/serialize-plain";
import { IListBlockSerializer, ISerializeListBlockHandlers } from "./types";

const renderPlainListBlockChild: ISerializeListBlockHandlers["child"] = (
  {
    scope,
    config: {
      child: { value },
    },
  },
  linkHandler
) => {
  return `• ${serializePlain(value, linkHandler, scope.replace)}`;
};

const renderPlainListChildren: ISerializeListBlockHandlers["childList"] = items => {
  return items.join("\n");
};

const renderPlainListBlockItem: ISerializeListBlockHandlers["item"] = (
  {
    scope,
    config: {
      top: { value },
    },
  },
  linkHandler,
  childContent
) => {
  return (
    serializePlain(value, linkHandler, scope.replace) +
    (childContent ? `\n${childContent}` : "")
  );
};

const renderPlainListBlock: ISerializeListBlockHandlers["list"] = (
  content,
  hasChildren
) => {
  if (hasChildren) {
    // only want bullets on children
    return content.join("\n\n");
  }

  return content.map(item => `• ${item}`).join("\n");
};

const getPlainListBlockSerializer: IListBlockSerializer = () => {
  return {
    child: renderPlainListBlockChild,
    childList: renderPlainListChildren,
    item: renderPlainListBlockItem,
    list: renderPlainListBlock,
  };
};

export default getPlainListBlockSerializer;
