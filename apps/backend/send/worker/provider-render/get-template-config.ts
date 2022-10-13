import { IChannel, IConfiguration, IProfile } from "~/types.api";
import { IBrandContext } from "../../types";
import { TemplateConfig } from "~/handlebars/template/types";
import applyBrand from "~/lib/notifications/apply-brand";

export function getTemplateConfig({
  brand,
  channel,
  channelConfig,
  providerConfig,
  profile,
  tenantId,
  title,
}: {
  brand?: IBrandContext;
  channel: string;
  channelConfig?: IChannel;
  profile: IProfile;
  providerConfig?: IConfiguration;
  tenantId: string;
  title?: string;
}) {
  const isEmail = channel.includes("email");
  const emailConfig = {
    ...(isEmail && brand
      ? applyBrand(
          channelConfig?.config?.email ?? { emailTemplateConfig: {} },
          brand
        )
      : channelConfig?.config?.email ?? undefined),
    ...(title && { emailSubject: title }),
  };

  // Required for some notification providers to render correctly. Comes from the notification template designed in studio
  const notificationProviderConfig = channelConfig?.providers?.find(
    (p) => p.key === providerConfig?.json?.provider
  )?.config;

  const templateConfig: TemplateConfig = {
    ...notificationProviderConfig,
    ...providerConfig?.json,
    channel,
    brand: {
      enabled: Boolean(brand),
      email: brand?.settings?.email,
    },
    // Note: This must be defined if the taxonomy is email. Otherwise handlebars will puke.
    email: emailConfig,
    locale: profile.locale,
    partials: brand?.partials,
    push: channelConfig?.config?.push ?? {
      icon: undefined,
      clickAction: undefined,
      title,
    },
    slots: channelConfig?.slots,
    tenantId,
  };

  return templateConfig;
}
