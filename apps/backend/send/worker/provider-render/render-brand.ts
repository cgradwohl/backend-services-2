import { IBrandContext } from "~/send/types";

/** Currently only handles brand locale interpolation */
export function renderBrand(opts: {
  brand?: IBrandContext;
  locale?: string;
}): IBrandContext | undefined {
  if (!opts.brand) {
    return undefined;
  }

  const localeBrand = (opts.brand.locales ?? {})[opts.locale];
  if (localeBrand) {
    return {
      ...localeBrand,
      partials: opts.brand.partials,
    };
  }

  return (opts.brand.locales ?? {})[opts.locale] ?? opts.brand;
}
