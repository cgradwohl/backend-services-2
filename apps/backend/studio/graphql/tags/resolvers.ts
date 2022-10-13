import { UnpackPromise } from "~/lib/types/unpack-promise";
import decodeId from "../lib/decode-id";
import { IResolver } from "../types";
import TagsDataSource from "./data-source";

type Category = UnpackPromise<ReturnType<TagsDataSource["get"]>>;
const objtype = "tag";

const tag: IResolver<Category> = async (_, args, context) =>
  args.tagId ? context.dataSources.tags.get(args.tagId) : null;

const templateTags: IResolver<{ tagIds: string[] }> = async (
  source,
  _,
  context
) => {
  const tagIds = source?.tagIds ?? [];
  return Promise.all(
    tagIds.map(async (tagId) => context.dataSources.tags.get(tagId))
  );
};

export default {
  Query: {
    tag,
  },

  Tag: {
    __isTypeOf: (source: Category) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },

  Template: {
    tags: templateTags,
  },
};
