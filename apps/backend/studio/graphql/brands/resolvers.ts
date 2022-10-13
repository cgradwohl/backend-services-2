import { UnpackPromise } from "~/lib/types/unpack-promise";
import decodeId from "../lib/decode-id";
import { IResolver } from "../types";
import BrandsDataSource from "./data-source";

type Brand = UnpackPromise<ReturnType<BrandsDataSource["get"]>>;
const objtype = "brand";

const brand: IResolver<Brand> = async (source, args, context) => {
  const brandId = args.brandId ?? source.brandId;
  return brandId ? context.dataSources.brands.get(brandId) : null;
};

export default {
  Query: {
    brand,
  },

  Brand: {
    __isTypeOf: (source: Brand) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },

  Template: {
    brand,
  },

  TemplateDraft: {
    brand,
  },
};
