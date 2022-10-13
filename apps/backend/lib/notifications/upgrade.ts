import uniq from "uniq";
import { v4 as createUUID } from "uuid";
import { batchGet as getConfigurations } from "~/lib/configurations-service";
import { get as getStrategy } from "~/lib/dynamo/strategies";
import { warn } from "~/lib/log";
import sendProviders from "~/providers";
import {
  EmailTemplateConfig,
  ExpoConfig,
  FacebookMessengerConfig,
  IChannel,
  ILegacyNotificationWire,
  INotificationWire,
  IStrategy,
} from "~/types.api";

function extractConfigurations(strategy: IStrategy): string[] {
  return uniq([
    ...(strategy.json.always || []),
    ...(strategy.json.configurations || []),
  ]);
}

function extractBlockIds(
  notification: ILegacyNotificationWire,
  provider: string
): string[] {
  const blocks = notification.json.providers[provider];
  const keys = Object.keys(blocks || {});

  if (keys.length > 1) {
    // has more than one block entry
    warn("More than one block entry detected", blocks);
  }

  if (keys.indexOf("body") === -1) {
    // no body block detected
    warn("No body block detected", blocks);
    return [];
  }

  return blocks.body;
}

function extractEmailTemplateConfig(
  event: ILegacyNotificationWire
): EmailTemplateConfig {
  const emailTemplateConfig: EmailTemplateConfig = {};

  if (!Boolean(event.json.emailTemplateConfig)) {
    return emailTemplateConfig;
  }

  if (event.json.emailTemplateConfig.headerLogoSrc !== undefined) {
    emailTemplateConfig.headerLogoSrc =
      event.json.emailTemplateConfig.headerLogoSrc;
  }
  if (event.json.emailTemplateConfig.headerLogoHref !== undefined) {
    emailTemplateConfig.headerLogoHref =
      event.json.emailTemplateConfig.headerLogoHref;
  }
  if (event.json.emailTemplateConfig.headerLogoAlign !== undefined) {
    emailTemplateConfig.headerLogoAlign =
      event.json.emailTemplateConfig.headerLogoAlign;
  }
  if (event.json.emailTemplateConfig.footerLinks !== undefined) {
    emailTemplateConfig.footerLinks =
      event.json.emailTemplateConfig.footerLinks;
  }
  if (event.json.emailTemplateConfig.footerTemplateName !== undefined) {
    emailTemplateConfig.footerTemplateName =
      event.json.emailTemplateConfig.footerTemplateName;
  }
  if (event.json.emailTemplateConfig.footerText !== undefined) {
    emailTemplateConfig.footerText = event.json.emailTemplateConfig.footerText;
  }
  if (event.json.emailTemplateConfig.templateName !== undefined) {
    emailTemplateConfig.templateName =
      event.json.emailTemplateConfig.templateName;
  }
  if (event.json.emailTemplateConfig.topBarColor !== undefined) {
    emailTemplateConfig.topBarColor =
      event.json.emailTemplateConfig.topBarColor;
  }

  return emailTemplateConfig;
}

function extractExpoConfig(notification: ILegacyNotificationWire): ExpoConfig {
  const expoConfig: ExpoConfig = {};

  if (!Boolean(notification.json.expoConfig)) {
    return expoConfig;
  }

  if (notification.json.expoConfig.subtitle !== undefined) {
    expoConfig.subtitle = notification.json.expoConfig.subtitle;
  }

  if (notification.json.expoConfig.title !== undefined) {
    expoConfig.title = notification.json.expoConfig.title;
  }

  return expoConfig;
}

function extractFacebookMessengerConfig(
  notification: ILegacyNotificationWire
): FacebookMessengerConfig {
  if (!Boolean(notification.json.fbMessengerConfig)) {
    return null;
  }

  return {
    fromAddress: notification.json.fbMessengerConfig.fromAddress,
    tag: notification.json.fbMessengerConfig.tag,
  } as FacebookMessengerConfig;
}

function getTaxonomy(key: string): string {
  const provider = sendProviders[key];

  return provider.taxonomy.class
    ? `${provider.taxonomy.channel}:${provider.taxonomy.class}:${key}`
    : `${provider.taxonomy.channel}:${key}`;
}

export default async function upgradeNotification(
  notification: ILegacyNotificationWire
): Promise<INotificationWire> {
  const { tenantId } = notification;

  const strategy = await getStrategy({
    id: notification.json.strategyId,
    tenantId,
  });

  const configurationIds = extractConfigurations(strategy);

  const configurations = configurationIds.length
    ? await getConfigurations({ configurationIds, tenantId })
    : [];

  function createChannel(configurationId: string): IChannel {
    const configuration = configurations.find(
      ({ id }) => id === configurationId
    );

    const upgraded: IChannel = {
      blockIds: extractBlockIds(notification, configuration.json.provider),
      config: {
        email: {},
      },
      id: createUUID(),
      providers: [
        {
          config: {},
          configurationId,
          key: configuration.json.provider,
        },
      ],
      taxonomy: getTaxonomy(configuration.json.provider),
    };
    // emailCC & emailBCC added after upgrade
    if (notification.json.emailReplyTo !== undefined) {
      upgraded.config.email.emailReplyTo = notification.json.emailReplyTo;
    }
    if (notification.json.emailSubject !== undefined) {
      upgraded.config.email.emailSubject = notification.json.emailSubject;
    }
    if (notification.json.emailTemplateConfig !== undefined) {
      upgraded.config.email.emailTemplateConfig = extractEmailTemplateConfig(
        notification
      );
    }
    if (notification.json.isUsingTemplateOverride !== undefined) {
      upgraded.config.email.isUsingTemplateOverride =
        notification.json.isUsingTemplateOverride;
    }
    if (notification.json.templateOverride !== undefined) {
      upgraded.config.email.templateOverride =
        notification.json.templateOverride;
    }

    if (notification.json.expoConfig) {
      upgraded.providers[0].config.expo = extractExpoConfig(notification);
    }

    if (notification.json.fbMessengerConfig) {
      upgraded.providers[0].config.fbMessenger = extractFacebookMessengerConfig(
        notification
      );
    }

    return upgraded;
  }

  const { providers } = notification.json;
  const hasMultipleSlotEntries = Object.keys(providers).some(
    key => Object.keys(providers[key]).length > 1
  );

  if (hasMultipleSlotEntries) {
    warn(
      "Notification has multiple slot entries. Expected only `body`",
      notification
    );
  }

  return {
    ...notification,
    json: {
      __legacy__strategy__id__: strategy.id,
      blocks: notification.json.blocks,
      channels: {
        always: (strategy.json.always || []).map(createChannel),
        bestOf: (strategy.json.configurations || []).map(createChannel),
      },
    },
  };
}
