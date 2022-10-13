import serializeList from "~/components/block-components/list/serialize";
import {
  IListBlock,
  IListBlockItem,
  IListBlockItemChild,
} from "~/components/block-components/list/types";
import serialize from "~/lib/link-discovery/slate-serializer";
import { ILinkHandler } from "~/lib/link-handler";
import { SerializerType } from "~/types.internal";
import { IBlockComponentLinkDiscoveryHandler } from ".";

const serializeListItem = (
  { config, scope, type }: IListBlockItem | IListBlockItemChild,
  linkHandler: ILinkHandler,
  serializerType: SerializerType
) => {
  const { value } = config[type];
  serialize(value, linkHandler, scope.replace, serializerType);
  return "";
};

const listBlockComponentLinkDiscovery: IBlockComponentLinkDiscoveryHandler = (
  block,
  serializerType
) => {
  const listBlock = block as IListBlock;

  return serializeList(listBlock, {
    child: (item, linkHandler) =>
      serializeListItem(item, linkHandler, serializerType),
    item: (item, linkHandler) => {
      return serializeListItem(item, linkHandler, serializerType);
    },
  });
};

export default listBlockComponentLinkDiscovery;
