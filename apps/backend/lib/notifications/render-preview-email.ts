import { getRawTenantPartials } from "~/handlebars/partials/get-tenant-partials";
import getProviderTemplate from "~/handlebars/template";
import getTemplateOverrides from "~/handlebars/template/get-template-overrides";
import renderTemplates from "~/handlebars/template/render-templates";
import { ITemplateHandler, TemplateConfig } from "~/handlebars/template/types";
import { toApiKey } from "~/lib/api-key-uuid";
import getBlocks from "~/lib/blocks";
import { applyBlockOverrides } from "~/lib/blocks/apply-overrides";
import { get as getBrand, getDefault as getDefaultBrand } from "~/lib/brands";
import { getBrandVariables } from "~/lib/brands/brand-variables";
import extendBrand from "~/lib/brands/extend-brand";
import { IBrand } from "~/lib/brands/types";
import { get as getConfiguration } from "~/lib/configurations-service";
import createLinkHandler from "~/lib/link-handler";
import { get as getNotification } from "~/lib/notification-service";
import { get as getNotificationDraft } from "~/lib/notification-service/draft";
import applyBrand from "~/lib/notifications/apply-brand";
import getDiscordTemplates from "~/lib/templates/discord";
import getExpoTemplates from "~/lib/templates/expo";
import getInAppTemplates from "~/lib/templates/in-app";
import getMsTeamsTemplates from "~/lib/templates/msteams";
import payloadOverride from "~/lib/templates/payload-override";
import getPlainTemplates from "~/lib/templates/plain";
import getPushTemplates from "~/lib/templates/push";
import getEmailTemplates from "~/lib/templates/sendgrid";
import getSlackTemplates from "~/lib/templates/slack";
import getWebhookTemplates from "~/lib/templates/webhook";
import { get as getTenant } from "~/lib/tenant-service";
import createVariableHandler from "~/lib/variable-handler";
import { DeliveryHandlerParams } from "~/providers/types";
import { INotificationWire, IProfile } from "~/types.api";
import { CourierRenderOverrides } from "~/types.internal";
import { ApiSendRequestOverride } from "~/types.public";
import { sendTrackEvent } from "../segment";

export interface RenderPreviewEmailParams {
  brandId?: string;
  channelId: string;
  courier: CourierRenderOverrides;
  draftId: string;
  eventData: Record<string, any>;
  eventProfile: IProfile;
  messageId: string;
  notificationId: string;
  override?: ApiSendRequestOverride;
  previewRender?: boolean;
  recipientId: string;
  tenantId: string;
  userPoolId?: string;
  users?: string[];
}

export default async function renderPreviewEmail(
  message: RenderPreviewEmailParams,
  userId?: string
): Promise<{
  params: DeliveryHandlerParams;
  templates: { [key: string]: any };
}> {
  if (!process.env.COURIER_EMAIL_CONFIG_ID || !process.env.COURIER_TENANT_ID) {
    throw new Error("Missing Courier Preview Config");
  }
  const tenant = await getTenant(message.tenantId);

  const notification = await getNotification({
    id: message.notificationId,
    tenantId: message.tenantId,
  });

  const notificationDraft = message.draftId
    ? await getNotificationDraft({
        id: message.draftId,
        tenantId: message.tenantId,
      })
    : undefined;

  if ("strategyId" in notification.json) {
    throw new Error("Cannot Preview Legacy Notifications");
  }

  const brandConfig = (() => {
    if (notificationDraft && notificationDraft.json.brandConfig) {
      return notificationDraft.json.brandConfig;
    }

    if (notification && notification.json.brandConfig) {
      return notification.json.brandConfig;
    }

    return {
      enabled: false,
    };
  })();

  const brandId = message.brandId || brandConfig.defaultBrandId;

  let brand = await (async () => {
    if (!brandConfig.enabled) {
      return;
    }

    if (brandId) {
      return getBrand(message.tenantId, brandId, {
        extendDefaultBrand: true,
      });
    }

    if (brandConfig.defaultBrandId) {
      return getBrand(message.tenantId, brandConfig.defaultBrandId, {
        extendDefaultBrand: true,
      });
    }

    return getDefaultBrand(message.tenantId);
  })();

  if (brand && message?.override?.brand) {
    brand = extendBrand(brand, message?.override?.brand as Partial<IBrand>);
  }

  const { channels } = notificationDraft
    ? (notificationDraft as INotificationWire).json
    : notification.json;

  const channel = [...(channels.always || []), ...(channels.bestOf || [])].find(
    (c) => c.id === message.channelId
  );

  if (!channel) {
    throw new Error(`Cannot find channel: ${message.channelId}`);
  }

  const configurationId = channel.providers?.[0]?.configurationId;
  const configuration = await getConfiguration(
    message.previewRender && configurationId
      ? {
          id: configurationId,
          tenantId: message.tenantId,
        }
      : {
          id: process.env.COURIER_EMAIL_CONFIG_ID,
          tenantId: process.env.COURIER_TENANT_ID,
        }
  );

  if (!configuration) {
    throw new Error(`Cannot find Configuration`);
  }

  const isEmail = channel.taxonomy.includes("email");
  const linkHandler = createLinkHandler({});

  const variableData = {
    messageId: "PREVIEW_MESSAGE_ID",
    brand: getBrandVariables(brand),
    courier: message.courier,
    data: message.eventData,
    event: toApiKey(message.notificationId),
    profile: message.eventProfile,
    recipient: message.recipientId,
    templateOverrides:
      isEmail && getTemplateOverrides(brand?.settings?.email?.templateOverride),
    urls: {
      unsubscribe: "https://mock.courier.com/unsubscribe",
    },
  };

  const variableHandler = createVariableHandler({
    value: variableData,
  });

  const emailConfig = applyBrand(
    {
      ...(channel.config?.email ?? {}),
      emailFrom:
        channel?.config?.email?.emailFrom ??
        "'Courier Preview' <preview@courier.com>",
    },
    brand
  );

  const brandPartials = (brand?.snippets?.items ?? []).reduce(
    (s: { [snippetName: string]: string }, snippet) => {
      s[snippet.name] = snippet.value;
      return s;
    },
    {}
  );
  const tenantPartials = getRawTenantPartials(message.tenantId);
  const partials = {
    ...tenantPartials,
    ...brandPartials,
  };

  const channelType = channel.taxonomy.split(":")[0];
  const channelOverride = message?.override?.channel?.[channelType];
  const params: DeliveryHandlerParams = {
    brand,
    config: configuration.json,
    channelOverride,
    override: undefined,
    profile: message.eventProfile,
    variableData,

    // handlers
    linkHandler,
    variableHandler,

    // for webhooks
    extendedProfile: null,
    sentProfile: null,

    // channel configuration
    ...emailConfig,
    // channel provider configuration
    expoConfig: undefined,
    fbMessengerConfig: undefined,
    handlebars: { partials },
  };

  const allWireBlocks = applyBlockOverrides(
    notificationDraft
      ? notificationDraft.json.blocks
      : notification.json.blocks,
    message?.override?.blocks
  );

  const allBlocks = getBlocks(
    allWireBlocks,
    linkHandler,
    variableHandler.getScoped("data")
  ).map((block) => {
    // TODO: HANDLEBARS: remove this map when HBS ships
    if (block.type === "template") {
      // @ts-ignore: type is transient and is forced up object
      block.partials = partials;
    }

    return block;
  });

  let templates = (() => {
    const templateConfig: TemplateConfig = {
      ...configuration.json,
      channel: channel.taxonomy.split(":")[0],
      locale: message.eventProfile?.locale,
      brand: {
        email: brand?.settings?.email,
        enabled: brandConfig?.enabled,
      },
      push: channel?.config?.push,
      email: emailConfig,
      partials,
      slots: channel?.slots,
    };
    const template = getProviderTemplate({
      allBlocks,
      channelBlockIds: channel.blockIds,
      config: templateConfig,
      isEmail: channel.taxonomy.includes("email"),
      isWebhook:
        channel.taxonomy.includes("webhook") ||
        channel.taxonomy.includes("push:web:pusher"),

      // slack is the only one we care about for headers
      provider: channel.taxonomy.includes("slack") ? "slack" : undefined,
      tenant,
    });
    let templateHandlers: {
      [x: string]: ITemplateHandler<
        | "elemental"
        | "discord"
        | "email"
        | "markdown"
        | "inApp"
        | "msteams"
        | "plain"
        | "slack"
        | "text"
        | "webhook"
      >;
    };

    const isCourier =
      channel.taxonomy.includes("courier") ||
      channel.providers.find((p) => p.key === "courier");

    if (isEmail) {
      templateHandlers = getEmailTemplates(template, templateConfig, {
        locales: channel.config.locales,
      });
    } else if (channel.taxonomy.includes("slack")) {
      templateHandlers = getSlackTemplates(template, templateConfig);
    } else if (channel.taxonomy.includes("msteams")) {
      templateHandlers = getMsTeamsTemplates(template, templateConfig);
    } else if (channel.taxonomy.includes("discord")) {
      templateHandlers = getDiscordTemplates(template, templateConfig);
    } else if (
      channel.taxonomy.includes("webhook") ||
      channel.taxonomy.includes("push:web:pusher")
    ) {
      templateHandlers = getWebhookTemplates(template, templateConfig);
    } else if (channel.taxonomy.includes("expo")) {
      templateHandlers = getExpoTemplates(template, templateConfig);
    } else if (isCourier) {
      templateHandlers = getInAppTemplates(template, templateConfig, {
        locales: channel.config.locales,
      });
    } else if (channel.taxonomy.includes("push:")) {
      templateHandlers = getPushTemplates(template, templateConfig, {
        locales: channel.config.locales,
      });
    } else {
      templateHandlers = getPlainTemplates(template, templateConfig);
    }

    return renderTemplates(
      templateHandlers,
      variableHandler,
      linkHandler,
      message.tenantId,
      channelOverride
    );
  })();

  if (isEmail && emailConfig?.payloadOverrideTemplate) {
    templates = payloadOverride({
      payloadOverrideTemplate: emailConfig.payloadOverrideTemplate,
      templates,
      variableHandler,
    });
  }

  if (userId) {
    await sendTrackEvent({
      body: {
        brandId: params?.brand?.id,
        draftId: message.draftId,
        messageId: message.messageId,
        provider: params?.config?.provider,
        templateId: message?.notificationId,
      },
      key: "notification-previewed",
      tenantId: message.tenantId,
      userId,
    });
  }

  return {
    params,
    templates,
  };
}
