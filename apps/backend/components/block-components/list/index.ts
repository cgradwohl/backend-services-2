import { ISerializableBlock } from "~/lib/blocks/serialize";
import { IVariableHandler } from "~/lib/variable-handler";
import { IListBlockConfig } from "~/types.api";
import { SerializerType } from "~/types.internal";

import listBlockForHtml from "./html";
import listBlockForMarkdown from "./md";
import listBlockForPlain from "./plain";
import serializeList from "./serialize";
import listBlockForSlack from "./slack";
import {
  IListBlock,
  IListBlockConfigWithChildren,
  IListBlockItem,
  IListBlockItemChild,
} from "./types";
import { getHasChildList } from "./utils";

const prepareItemChild = (
  config: IListBlockConfigWithChildren,
  scope: IVariableHandler
): IListBlockItemChild => {
  return {
    config,
    scope,
    type: "child",
  };
};

const prepareItemChildren = (
  config: IListBlockConfig,
  scope: IVariableHandler
) => {
  if (!config.child) {
    return undefined;
  }

  const configWithChild = config as IListBlockConfigWithChildren;

  return scope
    .repeat(config.child.path)
    .map(child => prepareItemChild(configWithChild, child));
};

const prepareItem = (
  config: IListBlockConfig,
  scope: IVariableHandler,
  hasChildren: boolean
): IListBlockItem => {
  const item: IListBlockItem = {
    config,
    scope,
    type: "top",
  };

  if (hasChildren) {
    item.children = prepareItemChildren(config, scope);
  }

  return item;
};

export const prepare = (block: ISerializableBlock): ISerializableBlock => {
  const config = block.config as IListBlockConfig;
  const hasChildren = getHasChildList(config);
  const items = block.scope
    .repeat(config.top.path)
    .map(item => prepareItem(config, item, hasChildren));

  if (items.length === 0) {
    return undefined;
  }

  const preparedBlock: IListBlock = {
    ...block,
    children: items,
    config,
    type: "list",
  };

  return preparedBlock;
};

const getSerializerHandlers = (
  block: IListBlock,
  serializeType: SerializerType
) => {
  switch (serializeType) {
    case "plain":
      return listBlockForPlain(block);
    case "md":
      return listBlockForMarkdown(block);
    case "slack":
      return listBlockForSlack(block);
    case "html":
      return listBlockForHtml(block);
    default:
      const exhaustiveCheck: never = serializeType;
      throw new Error(`Unexpected serializeType [${exhaustiveCheck}]`);
  }
};

const listComponent = (block: IListBlock, serializeType: SerializerType) => {
  if (!block) {
    return undefined;
  }

  return serializeList(block, getSerializerHandlers(block, serializeType));
};

export default listComponent;
