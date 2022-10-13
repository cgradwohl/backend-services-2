import extendBrand from "./extend-brand";
import deepExtend from "deep-extend";
import { IBrand } from "~/lib/brands/types";

export default (brand: IBrand, defaultBrand: IBrand): IBrand => {
  const brandSettingsEmail = brand?.settings?.email;
  const defaultBrandSettingsEmail = defaultBrand?.settings?.email;
  const appliedBrand = extendBrand(defaultBrand, brand);

  const footer = brandSettingsEmail?.footer?.inheritDefault
    ? defaultBrandSettingsEmail?.footer
    : {
        ...brandSettingsEmail?.footer,
        social: brandSettingsEmail?.footer?.social?.inheritDefault
          ? deepExtend(
              {},
              defaultBrandSettingsEmail?.footer?.social,
              brandSettingsEmail?.footer?.social
            )
          : brandSettingsEmail?.footer?.social,
      };

  appliedBrand.settings.email = {
    ...appliedBrand.settings.email,
    footer,
    head: brandSettingsEmail?.head?.inheritDefault
      ? defaultBrandSettingsEmail?.head
      : brandSettingsEmail?.head,
    header: brandSettingsEmail?.header?.inheritDefault
      ? defaultBrandSettingsEmail?.header
      : brandSettingsEmail?.header,
  };

  return appliedBrand;
};
