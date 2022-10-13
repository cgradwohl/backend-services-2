import { IBrandTemplateOverride } from "~/lib/brands/types";

const getTemplateOverrides = (brandEmailOverrides: IBrandTemplateOverride) => {
  const overrideSource = brandEmailOverrides?.enabled
    ? brandEmailOverrides.mjml?.enabled
      ? brandEmailOverrides.mjml
      : brandEmailOverrides
    : undefined;
  const { enabled, footer, head, header, ...overrides } =
    overrideSource || ({} as any);
  return overrides;
};

export default getTemplateOverrides;
