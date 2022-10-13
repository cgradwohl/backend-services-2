import { BrandCourierObject } from "./types";

type ToCourierObjectFn = (tenantId: string, brand: any) => BrandCourierObject;

const toCourierObject: ToCourierObjectFn = (tenantId, brand) => {
  if (!brand) {
    return null;
  }

  const {
    created,
    creator,
    id,
    name,
    published,
    settings,
    snippets,
    updated,
    updater,
    version,
  } = brand;

  return {
    created,
    creator,
    id,
    json: {
      settings: {
        colors: {
          primary: "#9122C2",
          secondary: "#C1B6DD",
          tertiary: "#E85178",
        },
        ...settings,
      },
      snippets,
    },
    objtype: "brand",
    published,
    tenantId,
    title: name,
    updated,
    updater,
    version,
  };
};

export default toCourierObject;
