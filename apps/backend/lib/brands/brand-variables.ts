import { toApiKey } from "../api-key-uuid";
import { IBrand } from "./types";

export const getBrandVariables = (
  brand?: IBrand
): {
  id?: string;
  colors?:
    | {
        primary: string;
        secondary: string;
        tertiary: string;
      }
    | {};
  email?: {
    header: {
      barColor?: string;
      logo: {
        href?: string;
        image?: string;
      };
    };
  };
  social?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    medium?: string;
    twitter?: string;
  };
} => {
  if (!brand) {
    return {};
  }

  const brandSettings = brand?.settings;
  const brandEmailSettings = brandSettings?.email;
  const brandSocials = brandEmailSettings?.footer?.social;

  return {
    id: toApiKey(brand.id),
    colors: brandSettings?.colors || {},
    email: {
      header: {
        barColor: brandEmailSettings?.header?.barColor,
        logo: brandEmailSettings?.header?.logo,
      },
    },
    social: Object.keys(brandSocials ?? {}).reduce((acc, curr) => {
      if (!brandSocials?.[curr].url) {
        return acc;
      }

      acc[curr] = brandSocials?.[curr].url;
      return acc;
    }, {}),
  };
};
