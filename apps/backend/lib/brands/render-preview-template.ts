import { getDefault, getLatest } from "~/lib/brands";
import createLinkHandler from "~/lib/link-handler";
import applyBrand from "~/lib/notifications/apply-brand";

import renderEmail from "~/lib/render/email";
import { get as getTenant } from "~/lib/tenant-service";
import createVariableHandler from "~/lib/variable-handler";
import applyDefaultBrand from "./apply-default";
import { getBrandVariables } from "./brand-variables";

import getBrandPartials from "~/handlebars/partials/get-brand-partials";
import getTenantPartials from "~/handlebars/partials/get-tenant-partials";

import { DeliveryHandlerParams } from "~/providers/types";

export default async function renderPreviewEmail(
  tenantId: string,
  brandId: string
): Promise<{
  params: DeliveryHandlerParams;
  templates: { [key: string]: any };
}> {
  const tenant = await getTenant(tenantId);
  const brand = await getLatest(tenantId, brandId);
  const defaultBrand = await getDefault(tenantId);
  const appliedBrand = applyDefaultBrand(brand, defaultBrand);

  const linkHandler = createLinkHandler({});
  const variableData = {
    brand: getBrandVariables(appliedBrand),
    data: {},
    profile: {},
    event: "PREVIEW_BRAND",
    recipient: "PREVIEW_RECIPIENT",
  };

  const variableHandler = createVariableHandler({
    value: variableData,
  });

  const dataScopedVariableHandler = variableHandler.getScoped("data");

  const brandPartials = getBrandPartials(appliedBrand);
  const tenantPartials = getTenantPartials(tenantId);
  const partials = {
    ...tenantPartials,
    ...brandPartials,
  };

  const emailConfig = applyBrand(
    {
      emailTemplateConfig: {},
    },
    appliedBrand
  );

  const params: DeliveryHandlerParams = {
    tenant,
    tenantId,
    brand: appliedBrand,
    config: {
      provider: "sendgrid",
    },
    override: undefined,
    profile: {},
    variableData: {
      data: {},
      event: "PREVIEW_BRAND",
      profile: {},
      recipient: "PREVIEW_RECIPIENT",
    },

    // handlers
    linkHandler,
    variableHandler: dataScopedVariableHandler,

    emailTemplateConfig: emailConfig.emailTemplateConfig,

    // for webhooks
    extendedProfile: null,
    sentProfile: null,

    // channel configuration
    // channel provider configuration
    expoConfig: undefined,
    fbMessengerConfig: undefined,
    handlebars: { partials },
  };

  const templates = renderEmail([], params);

  return {
    params,
    templates,
  };
}
