import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import {
  BlockConfig,
  IListBlockConfig,
  IListBlockChildConfig,
} from "~/types.api";
import { SerializerType, IBlockRendererResponse } from "~/types.internal";
import { ISerializableBlock } from "~/lib/blocks/serialize";

export type IListBlockConfigWithChildren = IListBlockConfig & {
  child: IListBlockChildConfig; // make child required
};

export interface IListBlockItemChild {
  config: IListBlockConfigWithChildren;
  scope: IVariableHandler;
  type: "child";
}

export interface IListBlockItem {
  children?: IListBlockItemChild[];
  config: IListBlockConfig;
  scope: IVariableHandler;
  type: "top";
}

export interface IListBlock extends ISerializableBlock {
  config: IListBlockConfig;
  type: "list";
  children?: IListBlockItem[];
}

export interface ISerializeListBlockHandlers {
  child: (
    item: IListBlockItemChild,
    linkHandler: ILinkHandler,
    index: number,
    last: number
  ) => IBlockRendererResponse;
  childList?: (content: IBlockRendererResponse[]) => IBlockRendererResponse;
  item: (
    item: IListBlockItem,
    linkHandler: ILinkHandler,
    childContent: IBlockRendererResponse,
    index: number,
    last: number
  ) => IBlockRendererResponse;
  list?: (
    content: IBlockRendererResponse[],
    hasChildren: boolean
  ) => IBlockRendererResponse;
}

export type IListBlockSerializer = (
  list: IListBlock
) => ISerializeListBlockHandlers;
