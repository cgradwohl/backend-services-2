import deepExtend from "deep-extend";
import { IBrand } from "~/lib/brands/types";

export default (baseBrand: IBrand, extendBrand: Partial<IBrand>): IBrand => {
  const baseBrandSettingsEmail = baseBrand?.settings?.email;
  const extendBrandSettingsEmail = extendBrand?.settings?.email;
  const extendedBrand = deepExtend({}, baseBrand, extendBrand);

  // we can't deepextend the entire brand because settings.email.footer.content
  // is a SlateJS value and we don't want to deep extend that
  if (extendedBrand?.settings?.email.footer) {
    extendedBrand.settings.email.footer = {
      ...baseBrandSettingsEmail?.footer,
      ...extendBrandSettingsEmail?.footer,
    };
  }

  extendedBrand.snippets = {
    items: [
      ...(baseBrand.snippets?.items ?? []),
      ...(extendBrand.snippets?.items ?? []),
    ],
  };

  return extendedBrand;
};
