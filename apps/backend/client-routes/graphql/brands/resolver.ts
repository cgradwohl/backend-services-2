import { UnpackPromise } from "~/lib/types/unpack-promise";
import decodeId from "../lib/decode-id";
import { IResolver } from "../types";
import BrandsDataSource from "./data-source";

type Brand = UnpackPromise<ReturnType<BrandsDataSource["get"]>>;
const objtype = "brand";

const brand: IResolver<Brand> = async (source, args, context) => {
  const brandId = args.brandId ?? source.brandId;
  const version = args.version;

  if (!brandId) {
    return;
  }

  if (version) {
    return context.dataSources.brands.getVersion(brandId, version);
  }

  return context.dataSources.brands.get(brandId);
};

const defaultBrand: IResolver<Brand> = async (_source, _args, context) => {
  return context.dataSources.brands.getDefault();
};

const inAppBrand: IResolver<Brand> = async (_source, _args, context) => {
  return context.dataSources.brands.getInApp();
};

export default {
  Query: {
    brand,
    defaultBrand,
    inAppBrand,
  },

  Brand: {
    __isTypeOf: (source: Brand) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },
  PreferencePage: {
    brand: defaultBrand,
  },
};
