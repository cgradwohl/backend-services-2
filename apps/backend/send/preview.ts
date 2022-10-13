import {
  Content,
  ContentMessage,
  TemplateMessage,
  UserRecipient,
} from "~/api/send/types";
import { fetchAndMergeProfile } from "~/lib/dynamo/profiles";
import { get as getTenant } from "~/lib/tenant-service";

import { getMessageBrands } from "./worker/commands/prepare/get-brand";
import { getVariableData } from "./worker/commands/prepare/get-variables";
import { generateRoutingSummary } from "./worker/commands/route/lib/generate-routing-summary";
import { IRoutingSummary } from "./worker/commands/route/types";
import { getRenderedTemplates } from "./worker/provider-render/get-rendered-templates";

import { nanoid } from "nanoid";
import { listProviders } from "~/lib/configurations-service";
import { TenantScope } from "~/types.internal";
import { ISendMessageContext } from "./types";

import makeError from "make-error";
import getTenantInfo from "~/lib/get-tenant-info";
import getPublishedState from "./utils/get-published-state";

import getNotification from "./worker/commands/prepare/get-notification";
import { INotificationWire } from "~/types.api";

export const MissingProvidersError = makeError("MissingProviders");

const handleSingleMessage = async (
  tenantId: string,
  message: ContentMessage | TemplateMessage
) => {
  let content: Content | INotificationWire;
  const { environment } = getTenantInfo(tenantId);

  // NOTE: getTenant() does not respect a test tenantId and will not return a `tenant_id/test`
  const tenantObject = await getTenant(tenantId);
  const tenant = {
    ...tenantObject,
    tenantId, // NOTE: this tenantId needs to respect the test environment
  };

  // savedProfile has recipient preferences set using preferences API
  const [providers, { mergedProfile: profile }] = await Promise.all([
    listProviders(tenantId),
    fetchAndMergeProfile({
      tenantId,
      toProfile: message.to,
    }),
  ]);

  if (!providers?.length) {
    throw new MissingProvidersError();
  }

  const scope: TenantScope = `published/${environment}`;
  const brands = await getMessageBrands({
    mainBrandId: message.brand_id,
    channels: message.channels,
    scope,
    tenantId,
  });

  if ("template" in message) {
    const templateMessage = message as TemplateMessage;
    const notification = await getNotification(
      tenantId,
      templateMessage.template,
      "published/production"
    );
    content = notification;
  } else {
    content = message.content;
  }

  const userId =
    "user_id" in message.to ? message.to.user_id : `anon_${nanoid()}`;

  const variableData = await getVariableData({
    messageId: "PREVIEW_MESSAGE_ID",
    emailOpenTracking: tenant?.emailOpenTracking?.enabled,
    openTrackingId: undefined,
    unsubscribeTrackingId: undefined,
    recipientId: userId,
    tenantId: tenant.tenantId,
    profile,
    data: message?.data,
    environment,
    scope: getPublishedState(scope),
  });

  const sendContext: ISendMessageContext = {
    brands,
    category: undefined,
    channels: message?.channels,
    content,
    data: message.data,
    dryRunKey: undefined,
    environment,
    preferences: undefined,
    profile,
    providers,
    strategy: {
      routing: message.routing,
      channels: message.channels ?? {},
      providers: message.providers ?? {},
    },
    scope,
    tenant,
    variableData,
    overrides: undefined,
  };

  const routingSummary: Array<Partial<IRoutingSummary>> =
    await generateRoutingSummary({
      providerConfigs: sendContext.providers,
      strategy: sendContext.strategy,
      params: {
        data: sendContext.data,
        profile: sendContext.profile,
      },
    });

  const renderedChannels = await Promise.all(
    routingSummary?.map(async (route) => {
      if (!route.selected) {
        return;
      }

      const providerConfig = providers.find(
        (p) => p.id === route.configurationId
      );

      const result = await getRenderedTemplates(sendContext, {
        brand: brands.main,
        channel: route.channel,
        channelRendered: undefined,
        providerConfig,
      });

      return {
        channel: route.channel,
        renderedTemplates: result.renderedTemplates,
      };
    })
  );

  const messageTo = message.to as UserRecipient;

  return {
    routingSummary,
    userId: messageTo.user_id,
    channels: renderedChannels.filter(Boolean),
  };
};

export const previewMessage = (tenantId: string, message: ContentMessage) => {
  if (!Array.isArray(message.to)) {
    return Promise.all([handleSingleMessage(tenantId, message)]);
  }

  const messageTo = message.to as UserRecipient[];
  return Promise.all(
    messageTo.map((to) =>
      handleSingleMessage(tenantId, {
        ...message,
        to,
      })
    )
  );
};
