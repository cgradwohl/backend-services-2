import { UnpackPromise } from "~/lib/types/unpack-promise";
import decodeId from "../lib/decode-id";
import { IResolver } from "../types";
import Categories from "./data-source";

type Category = UnpackPromise<ReturnType<Categories["get"]>>;
const objtype = "category";

const category: IResolver<Category> = async (source, args, context) => {
  const categoryId = args.categoryId ?? source.categoryId;
  return categoryId ? context.dataSources.categories.get(categoryId) : null;
};

export default {
  Query: {
    category,
  },

  Category: {
    __isTypeOf: (source: Category) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },

  Template: {
    category,
  },
};
