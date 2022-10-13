import makeError from "make-error";
export const MissingBrandError = makeError("MissingBrandError");
export const MissingBrandEmailSettingsError = makeError(
  "MissingBrandEmailSettingsError"
);
import { IBrand } from "~/lib/brands/types";

export default (emailConfig, brand: IBrand) => {
  if (!emailConfig) {
    return;
  }

  const emailTemplateConfig = emailConfig.emailTemplateConfig;
  if (!emailTemplateConfig || !brand) {
    return emailConfig;
  }

  const brandEmailSettings = brand.settings.email;
  if (!brandEmailSettings) {
    throw new MissingBrandEmailSettingsError("Missing Brand Email Settings");
  }

  const { header = {}, footer = {} } = brandEmailSettings;

  // temporary to use the line template with brand
  emailTemplateConfig.templateName = "line";
  emailTemplateConfig.footerText = footer.content
    ? JSON.stringify(footer.content)
    : undefined;
  emailTemplateConfig.footerLinks = Object.keys(footer.social || {}).reduce(
    (acc, socialName) => {
      if (footer.social[socialName].url) {
        acc[socialName] = footer.social[socialName].url;
      }

      return acc;
    },
    {}
  );

  const headerLogo = header.logo || {};

  const colors = brand.settings.colors ?? {};
  const topBarColor =
    brand.version === "2022-05-17"
      ? header.barColor ?? colors["bar_color"] ?? colors.primary
      : header.barColor;
  emailTemplateConfig.headerLogoSrc = headerLogo.image;
  emailTemplateConfig.headerLogoHref = headerLogo.href;
  emailTemplateConfig.topBarColor = topBarColor;

  emailConfig.emailTemplateConfig = emailTemplateConfig;

  return emailConfig;
};
