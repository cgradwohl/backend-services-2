import { SQSRecord } from "aws-lambda";
import { getRawTenantPartials } from "~/handlebars/partials/get-tenant-partials";
import getProviderTemplate from "~/handlebars/template";
import getTemplateOverrides from "~/handlebars/template/get-template-overrides";
import renderTemplates from "~/handlebars/template/render-templates";
import { TemplateConfig } from "~/handlebars/template/types";
import { EmailDomainBlockedError } from "~/lib/assertions/email-domain-allowed";
import getBlocks from "~/lib/blocks";
import { applyBlockOverrides } from "~/lib/blocks/apply-overrides";
import { getBrandVariables } from "~/lib/brands/brand-variables";
import extendBrand from "~/lib/brands/extend-brand";
import captureException from "~/lib/capture-exception";
import { CHANNEL_EMAIL } from "~/lib/channel-taxonomy";
import { translationComparisonMetric } from "~/lib/courier-emf/logger-metrics-utils";
import { createMd5Hash } from "~/lib/crypto-helpers";
import {
  createErrorEvent,
  createProviderAttemptEvent,
  createRenderedEvent,
  createRoutedEvent,
  createSentEvent,
  createSimulatedEvent,
  createUndeliverableEvent,
  createUnroutableEvent,
} from "~/lib/dynamo/event-logs";

import { EmailParseError } from "~/lib/email-parser";
import { RoutingError } from "~/lib/errors";
import {
  generateOpenedLink,
  generateUnsubscribeTrackingIdLink,
} from "~/lib/generate-tracking-links";
import handleErrorLog from "~/lib/handle-error-log";
import { JsonnetEvalError } from "~/lib/jsonnet";
import { HandlebarsEvalError } from "~/lib/jsonnet/jsonbars";
import createLinkHandler, { ILinkData, ILinkHandler } from "~/lib/link-handler";
import logger from "~/lib/logger";
import { IMessageLog } from "~/lib/message-service/types";
import applyBrand from "~/lib/notifications/apply-brand";

import {
  getChannelPreferences,
  getUserPreference,
  mapPreferences,
} from "~/lib/preferences";
import jsonStore from "~/lib/s3";
import { createEventHandlerWithFailures } from "~/lib/sqs/create-event-handler";
import payloadOverride from "~/lib/templates/payload-override";
import { get as getTenant } from "~/lib/tenant-service";
import { getTrackingDomain } from "~/lib/tracking-domains";
import { generateTrackingId } from "~/lib/tracking-service/generate-tracking-id";
import { getLinkTrackingCallback } from "~/lib/tracking-service/get-link-tracking-callback";
import { saveClickThroughTrackingRecords } from "~/lib/tracking-service/save-click-through-tracking";
import createVariableHandler, {
  IVariableHandler,
} from "~/lib/variable-handler";
import { pluckPreferenceRulesByTypes, ruleHandlers } from "~/preferences/rules";
import providers from "~/providers";
import {
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";
import renderHandlers from "~/providers/render-handlers";
import sendHandlers from "~/providers/send-handlers";

import {
  DeliveryHandlerParams,
  IProvider,
  IProviderWithTemplates,
  ITemplates,
} from "~/providers/types";
import {
  Block,
  CourierObject,
  IBrand,
  IChannel,
  IConfigurationJson,
  INotificationWire,
  ITenant,
  JSONObject,
} from "~/types.api";
import { S3Message, SqsRouteMessage, ValueOf } from "~/types.internal";
import { ApiSendRequestOverrideChannel } from "~/types.public";
import {
  isRetryable,
  retrySqsMessage,
} from "~/workers/utils/retry-sqs-message";
import { channelHandles } from "./channel-handles";

const { get } = jsonStore<S3Message>(process.env.S3_MESSAGES_BUCKET);

export const render = async <T extends ITemplates>({
  channel,
  channelOverride,
  linkHandler,
  providerKey,
  renderHandler,
  templateConfig,
  tenant,
  variableHandler,
  allBlocks,
  messageId,
  shouldVerifyRequestTranslation = false,
}: {
  channel: IChannel;
  channelOverride: ValueOf<ApiSendRequestOverrideChannel["channel"]>;
  linkHandler: ILinkHandler;
  provider: IProvider;
  providerKey: string;
  renderHandler: IProviderWithTemplates<T>["getTemplates"];
  templateConfig: TemplateConfig;
  tenant: ITenant;
  variableHandler: IVariableHandler;
  allBlocks: Block[];
  messageId: string;
  shouldVerifyRequestTranslation?: boolean;
}) => {
  const isEmail = channel.taxonomy.includes("email");
  const isWebhook =
    channel.taxonomy.includes("webhook") ||
    channel.taxonomy.includes("push:web:pusher");

  const variableData = variableHandler.getRootValue();
  if (isEmail) {
    variableData.templateOverrides = getTemplateOverrides(
      templateConfig.brand?.email?.templateOverride
    );
  }

  const providerTemplate = getProviderTemplate({
    allBlocks,
    channelBlockIds: channel.blockIds,
    config: templateConfig,
    isEmail,
    isWebhook,
    provider: providerKey,
    tenant,
  });
  if (shouldVerifyRequestTranslation === true) {
    await translationComparisonMetric({
      requestVersion: "v1",
      tenantId: tenant.tenantId,
      properties: [
        {
          hashedRenderedOutput: createMd5Hash(JSON.stringify(allBlocks)),
        },
        {
          traceId: messageId,
        },
      ],
    });
  }

  const templateMap = renderHandler(providerTemplate, templateConfig, {
    locales: channel.config?.locales,
    taxonomy: channel.taxonomy,
  });

  let templates = renderTemplates(
    templateMap,
    variableHandler,
    linkHandler,
    tenant.tenantId,
    channelOverride
  );

  if (isEmail && templateConfig?.email?.payloadOverrideTemplate) {
    templates = payloadOverride({
      payloadOverrideTemplate: templateConfig.email.payloadOverrideTemplate,
      templates,
      variableHandler,
    });
  }

  return {
    templateString: providerTemplate.templateString,
    templates,
  };
};

const noop = () => undefined;

const route = async (message: SqsRouteMessage): Promise<void> => {
  let pickedConfig: CourierObject<IConfigurationJson>;
  let channel: IChannel;

  try {
    let json: S3Message & {
      event?: INotificationWire;
      notification?: INotificationWire;
    };

    switch (message.messageLocation.type) {
      case "S3":
        json = await get(message.messageLocation.path as string);
        break;
      case "JSON":
        json = message.messageLocation.path as S3Message;
        break;
    }

    const {
      category,
      clickThroughTracking = { enabled: false },
      configurations,
      courier,
      data,
      emailOpenTracking = { enabled: true },
      override,
      preferences,
      recipientId,
      dryRunKey,
    } = json;

    logger.debug(`Courier render overrides:- ${JSON.stringify(courier)}`);

    if (typeof override?.channel?.email?.tracking?.open === "boolean") {
      emailOpenTracking.enabled = override.channel.email.tracking.open;
    }

    if (message.tenantId.includes("test")) {
      emailOpenTracking.enabled = false;
      clickThroughTracking.enabled = false;
    }

    let { brand } = json;

    const profile = (
      json.profile && typeof json.profile === "object" ? json.profile : {}
    ) as JSONObject;
    const sentProfile = (
      json.sentProfile && typeof json.sentProfile === "object"
        ? json.sentProfile
        : {}
    ) as JSONObject;

    // legacy support
    const notification = json.notification || json.event;
    const eventId = json.eventId || notification.id;
    const openTrackingId = generateTrackingId();
    const unsubscribeTrackingId = generateTrackingId();

    if (brand && override?.brand) {
      brand = extendBrand(brand, override?.brand as Partial<IBrand>);
    }

    const trackingDomain = await getTrackingDomain(message.tenantId);

    // data that can be used in templates
    const variableData = {
      brand: getBrandVariables(brand),
      courier,
      data,
      event: eventId,
      messageId: message.messageId,
      profile,
      recipient: recipientId,
      urls: {
        opened: emailOpenTracking.enabled
          ? generateOpenedLink(message.tenantId, openTrackingId, trackingDomain)
          : null,
        unsubscribe: generateUnsubscribeTrackingIdLink(
          message.tenantId,
          unsubscribeTrackingId,
          trackingDomain
        ),
      },
    };

    const variableHandler = createVariableHandler({
      value: variableData,
    });

    // build configuration map
    const configurationMap = configurations.reduce(
      (acc, config) => ({
        ...acc,
        [config.id]: config,
      }),
      {}
    );

    const userPreference = getUserPreference({
      category,
      notification,
      preferences,
    });

    if (userPreference) {
      await createUndeliverableEvent(
        message.tenantId,
        message.messageId,
        userPreference.reason as IMessageLog["reason"],
        userPreference.message,
        { preferences: mapPreferences(preferences) }
      );
      return;
    }

    // Snoozing logic
    const [categoryPreferenceRules, notificationPreferenceRules] =
      pluckPreferenceRulesByTypes(category, notification, preferences);

    const [hasSnoozedCategory] = categoryPreferenceRules
      .filter((rule) => rule.type === "snooze")
      .map((rule) => ruleHandlers[rule.type](rule));

    const [hasSnoozedNotification] = notificationPreferenceRules
      .filter((rule) => rule.type === "snooze")
      .map((rule) => ruleHandlers[rule.type](rule));

    if (hasSnoozedCategory || hasSnoozedNotification) {
      const reason = hasSnoozedCategory
        ? "Snoozed at category level by user"
        : "Snoozed at notification level by user";

      await createUndeliverableEvent(
        message.tenantId,
        message.messageId,
        "FILTERED",
        reason as IMessageLog["reason"],
        {
          ...(categoryPreferenceRules !== null && { categoryPreferenceRules }),
          ...(notificationPreferenceRules !== null && {
            notificationPreferenceRules,
          }),
        }
      );

      return;
    }

    const preferredChannels = getChannelPreferences(
      category,
      notification,
      preferences,
      notification.json?.channels?.bestOf
    );

    const channelHandlesResult = await channelHandles(
      variableHandler,
      preferredChannels,
      configurationMap
    );

    channel = channelHandlesResult?.channel;
    const channelsSummary = channelHandlesResult?.channelsSummary;

    if (!channel) {
      await createUnroutableEvent(
        message.tenantId,
        message.messageId,
        "NO_CHANNELS",
        "No Valid Delivery Channel"
      );
      return;
    }

    const channelProvider = channelHandlesResult?.channelProvider;
    pickedConfig = configurationMap[channelProvider.configurationId];

    if (!pickedConfig) {
      await createUnroutableEvent(
        message.tenantId,
        message.messageId,
        "NO_PROVIDERS",
        "No Valid Delivery Provider",
        {
          channel: {
            id: channel.id,
            label: channel.label,
            taxonomy: channel.taxonomy,
          },
        }
      );
      return;
    }

    await createRoutedEvent(message.tenantId, message.messageId, {
      channelsSummary,
      preferences: mapPreferences(preferences),
    });

    const {
      json: { provider: providerKey },
    } = pickedConfig;
    const provider = providers[providerKey];
    const sendHandler = sendHandlers[providerKey];
    const renderHandler = renderHandlers[providerKey];

    if (!provider) {
      throw new RoutingError(`Provider Not Implemented: ${providerKey}`);
    }

    const channelProviderConfig = channelProvider?.config ?? {};

    const isSMS = channel.taxonomy.includes("sms");
    const clickThroughTrackingEnabled =
      clickThroughTracking.enabled && !isSMS && dryRunKey !== "mock";

    const emailOpenTrackingEnabled =
      emailOpenTracking.enabled && !isSMS && dryRunKey !== "mock";

    const supportsWebhooks = (pickedConfig.json as any).allowWebhooks;

    const links: { [context: string]: ILinkData } = {};

    const trackingHandler = clickThroughTrackingEnabled
      ? await getLinkTrackingCallback(links, message.tenantId)
      : noop;

    const linkHandler = createLinkHandler(
      links,
      clickThroughTrackingEnabled,
      supportsWebhooks,
      trackingHandler
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

    const allWireBlocks = applyBlockOverrides(
      notification.json.blocks,
      override?.blocks
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

    const emailConfig = applyBrand(channel?.config?.email, brand);

    const templateConfig: TemplateConfig = {
      ...channelProviderConfig,
      ...pickedConfig.json,
      channel: channel.taxonomy.split(":")[0],
      brand: {
        email: brand?.settings?.email,
        enabled: notification.json.brandConfig?.enabled,
      },
      email: emailConfig,
      locale: profile?.locale,
      partials,
      push: channel?.config?.push,
      tenantId: message.tenantId,
    };

    if (
      provider?.taxonomy?.channel === CHANNEL_EMAIL &&
      !templateConfig?.email
    ) {
      await createUnroutableEvent(
        message.tenantId,
        message.messageId,
        "NO_CHANNELS",
        "No Valid Delivery Channel. Email Channel Not Setup."
      );
      return;
    }

    const tenant = await getTenant(message.tenantId);

    const channelType = channel.taxonomy.split(":")[0];
    const channelOverride = override?.channel?.[channelType];

    const { templates } = await render({
      channel,
      channelOverride,
      linkHandler,
      provider,
      providerKey,
      renderHandler,
      templateConfig,
      tenant,
      variableHandler,
      allBlocks,
      messageId: message.messageId,
      shouldVerifyRequestTranslation: message?.shouldVerifyRequestTranslation,
    });

    const trackingRecords = await saveClickThroughTrackingRecords({
      channel,
      clickThroughTrackingEnabled,
      emailOpenTrackingEnabled,
      links,
      message,
      notification,
      openTrackingId,
      unsubscribeTrackingId,
      providerConfig: pickedConfig,
      recipientId,
      variableData,
    });

    await createRenderedEvent(
      message.tenantId,
      message.messageId,
      providerKey,
      pickedConfig.id,
      { id: channel.id, label: channel.label, taxonomy: channel.taxonomy },
      templates,
      trackingRecords?.trackingIds,
      brand && {
        id: brand?.id,
        version: brand?.version,
      }
    );

    const params: DeliveryHandlerParams = {
      brand,
      channelOverride,
      // Adding it conditionally since we won't have this attributes if we are retrying a historical message
      ...(trackingRecords.trackingUrls?.channelTrackingUrl && {
        channelTrackingUrl: trackingRecords.trackingUrls.channelTrackingUrl,
      }),
      config: pickedConfig.json,
      eventId,
      messageId: message.messageId,
      override: override?.[providerKey],
      profile,
      recipient: recipientId,
      sentProfile,
      tenant,
      tenantId: message.tenantId,
      trackingIds: trackingRecords?.trackingIds,
      variableHandler: variableHandler.getScoped("data"),

      // channel configuration
      ...emailConfig,

      // channel provider configuration
      beamerConfig: channelProviderConfig.beamer,
      chatApiConfig: channelProviderConfig.chatApi,
      discordConfig: channelProviderConfig.discord,
      expoConfig: channelProviderConfig.expo,
      fbMessengerConfig: channelProviderConfig.fbMessenger,
      firebaseFcmConfig: channelProviderConfig.firebaseFcm,
      slackConfig: channelProviderConfig.slack,
      streamChatConfig: channelProviderConfig.streamChat,
    };

    if (trackingRecords.trackingUrls?.channelTrackingUrl) {
      params.channelTrackingUrl =
        trackingRecords.trackingUrls.channelTrackingUrl;
    }

    await createProviderAttemptEvent(
      message.tenantId,
      message.messageId,
      providerKey,
      pickedConfig.id,
      { id: channel.id, label: channel.label, taxonomy: channel.taxonomy }
    );

    let providerResponse = {};

    if (dryRunKey === "mock") {
      providerResponse = {
        "message-id": "null-routed: success",
      };
      await createSimulatedEvent(
        message.tenantId,
        message.messageId,
        providerKey,
        pickedConfig.id,
        providerResponse,
        { id: channel.id, label: channel.label, taxonomy: channel.taxonomy }
      );
      return;
    }
    providerResponse = await sendHandler(
      params,
      templates as {
        [key: string]: any;
      }
    );

    await createSentEvent(
      message.tenantId,
      message.messageId,
      providerKey,
      pickedConfig.id,
      providerResponse,
      { id: channel.id, label: channel.label, taxonomy: channel.taxonomy }
    );
  } catch (e) {
    if (e instanceof EmailDomainBlockedError) {
      await createUndeliverableEvent(
        message.tenantId,
        message.messageId,
        "INVALID_ADDRESS",
        `${e.emailAddress} belongs to a reserved domain name`,
        {
          channel: channel
            ? {
                id: channel.id,
                label: channel.label,
                taxonomy: channel.taxonomy,
              }
            : undefined,
          provider: pickedConfig?.json?.provider,
        }
      );
      return;
    }

    logger.debug(message);

    let errorString = "Internal Courier Error";
    let errorData;
    let providerRequest: object;

    if (
      e instanceof ProviderConfigurationError ||
      e instanceof RoutingError ||
      e instanceof ProviderResponseError ||
      e instanceof EmailParseError ||
      e instanceof JsonnetEvalError ||
      e instanceof HandlebarsEvalError ||
      e instanceof RetryableProviderResponseError
    ) {
      errorString = e.toString();

      if (e instanceof ProviderResponseError) {
        errorData = e.payload;
        providerRequest = e.request;
      }

      if (e instanceof EmailParseError) {
        errorData = e.data;
      }
    }

    const retryable =
      (errorString === "Internal Courier Error" ||
        e instanceof RetryableProviderResponseError) &&
      isRetryable(message);

    await createErrorEvent(message.tenantId, message.messageId, errorString, {
      channel: channel
        ? { id: channel.id, label: channel.label, taxonomy: channel.taxonomy }
        : undefined,
      configuration: pickedConfig ? pickedConfig.id : undefined,
      provider: pickedConfig ? pickedConfig.json.provider : undefined,
      providerRequest,
      providerResponse: {
        ...e.error,
        ...errorData,
      },
      willRetry: retryable,
    });

    if (errorString === "Internal Courier Error") {
      handleErrorLog(e);
      await captureException(e);
    }

    if (retryable) {
      await retrySqsMessage(message);
    }
  }
};

export const handleRecord = async (record: SQSRecord) => {
  const message = (
    typeof record.body === "string" ? JSON.parse(record.body) : record.body
  ) as SqsRouteMessage;
  await route(message);
};

export default createEventHandlerWithFailures(
  handleRecord,
  process.env.ROUTE_SEQUENCE_TABLE
);
