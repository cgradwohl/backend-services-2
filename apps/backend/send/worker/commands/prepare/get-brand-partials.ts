import { getRawTenantPartials } from "~/handlebars/partials/get-tenant-partials";
import { IBrand } from "~/lib/brands/types";

export const getBrandPartials = (payload: {
  brand: IBrand;
  tenantId: string;
}) => {
  const { brand, tenantId } = payload;
  const brandPartials = (brand?.snippets?.items ?? []).reduce(
    (s: { [snippetName: string]: string }, snippet) => {
      s[snippet.name] = snippet.value;
      return s;
    },
    {}
  );

  const tenantPartials = getRawTenantPartials(tenantId);

  const partials = {
    ...tenantPartials,
    ...brandPartials,
  };

  return partials;
};
