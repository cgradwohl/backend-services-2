import { nanoid } from "nanoid";
import { TemplateMessage, UserRecipient } from "~/api/send/types";
import shouldFilter from "~/lib/conditional-filter";
import {
  createFilteredEvent,
  createMappedEvent,
  createUnmappedEvent,
  createUnroutableEvent,
} from "~/lib/dynamo/event-logs";
import { findPricingPlanForTenant } from "~/lib/plan-pricing";
import { getTimeoutTable } from "~/lib/send-routing";
import { generateTrackingId } from "~/lib/tracking-service/generate-tracking-id";
import createVariableHandler from "~/lib/variable-handler";
import { RequestPayload } from "~/send/service/data/request/request.types";
import { ISendMessageContext } from "~/send/types";
import { getMaxAge } from "~/send/utils/get-age";
import getPublishedState from "~/send/utils/get-published-state";
import { ITenant } from "~/types.api";
import { buildUtmMap } from "../../provider-render/augment-href";
import { NotificationNotFoundError } from "./errors";
import { extendRoutingStrategy } from "./extend-routing-strategy";
import { getMessageBrands } from "./get-brand";
import getCategory from "./get-category";
import getNotification from "./get-notification";
import { getOverrides } from "./get-overrides";
import getProviders from "./get-providers";
import { getRoutingTree } from "./get-routing";
import { getTokens } from "./get-tokens";
import getUserPreferences from "./get-user-preferences";
import { getVariableData } from "./get-variables";
import loadProfile from "./load-profile";

export async function prepareFromTemplateMessage({
  tenant,
  message,
  messageId,
  request,
  environment,
  data,
  shouldVerifyRequestTranslation = false,
}: {
  tenant: ITenant;
  messageId: string;
  message: TemplateMessage;
  request?: RequestPayload;
  environment: "production" | "test";
  data?: Record<string, unknown>;
  shouldVerifyRequestTranslation?: boolean;
}): Promise<ISendMessageContext | false> {
  const to = request.message.to as UserRecipient;
  const notification = await getNotification(
    tenant.tenantId,
    message.template,
    request?.scope!
  );

  if (!notification) {
    await createUnmappedEvent(tenant.tenantId, messageId, {
      eventId: message.template,
    });

    return false;
  }

  // TODO: support block overrides: https://linear.app/trycourier/issue/C-4891/support-block-overrides
  const overrides = getOverrides(message);

  const requestLevelPreferences = "preferences" in to && to.preferences;

  const [brands, profileInfo, providers, category, tokens, strategy] =
    await Promise.all([
      // TODO: extend providers and channels with their overrides: https://linear.app/trycourier/issue/C-4671/refactor-improve-and-simplify-context
      getMessageBrands({
        mainBrandId: message.brand_id,
        channels: message.channels,
        tenantId: tenant.tenantId,
        notification,
        emailOverride: overrides?.brand,
        scope: request?.scope!,
      }),
      // savedProfile has recipient preferences set using preferences API
      loadProfile({
        messageId,
        tenantId: tenant.tenantId,
        to: message.to as UserRecipient, // Prepare,Route,Render,Send only interact with UserRecipient
        shouldVerifyRequestTranslation,
      }),
      getProviders(notification),
      getCategory(notification),
      getTokens({ tenantId: tenant.tenantId, userId: to.user_id }),
      extendRoutingStrategy(message, tenant.tenantId),
    ]);

  if (shouldVerifyRequestTranslation === false) {
    await createMappedEvent(tenant.tenantId, messageId, {
      eventId: message.template,
      fromMap: notification.id !== message.template,
      notificationId: notification.id,
    });
  }

  const { profile, savedProfile } = profileInfo;

  if (!providers?.length) {
    await createUnroutableEvent(
      tenant.tenantId,
      messageId,
      "NO_PROVIDERS",
      "No providers added"
    );

    return false;
  }

  const preferences = await getUserPreferences(
    savedProfile ?? { id: to?.user_id },
    tenant.tenantId,
    requestLevelPreferences,
    notification.json?.preferenceTemplateId,
    notification.id
  );

  const openTrackingId = generateTrackingId();
  const unsubscribeTrackingId = generateTrackingId();

  const userId =
    "user_id" in message.to ? message.to.user_id : `anon_${nanoid()}`;

  const utmMap = buildUtmMap({ message });

  // TODO: this should probably consider timeouts configured in strategy.
  const timeouts = getTimeoutTable({
    timeout: message.timeout,
    channels: message.channels,
    providers: message.providers,
    plan: findPricingPlanForTenant(tenant),
  });

  /** @deprecated in favor of timeouts. */
  const maxAge = getMaxAge({
    timeout: message.timeout,
    channels: message.channels,
    providers: message.providers,
    plan: findPricingPlanForTenant(tenant),
  });

  const variableData = await getVariableData(
    {
      messageId,
      data,
      emailOpenTracking: !!tenant.emailOpenTracking?.enabled,
      environment,
      event: message.metadata?.event,
      /** TODO: Remove once the july-2022-routing-tree-enabled has been enabled for everyone and run without issue */
      maxAge,
      openTrackingId,
      unsubscribeTrackingId,
      profile,
      recipientId: userId!,
      scope: getPublishedState(request?.scope!),
      template: message.template,
      tenantId: tenant.tenantId,
      utmMap,
      tokens,
    },
    // use whatever brand is used in send call (if any) or fallback to the default brand
    brands.main?.id
  );

  const variableHandler = createVariableHandler({
    value: variableData,
  });

  if (shouldFilter(variableHandler, notification.json.conditional!)) {
    await createFilteredEvent(tenant.tenantId, messageId, {
      condition: notification.json.conditional,
    });

    return false;
  }

  const routing = await getRoutingTree({
    message,
    tenantId: tenant.tenantId,
    templateV1: notification,
    profile,
    tokens,
    providerConfigs: providers,
    strategy,
    variableData,
    category,
    preferences,
  });

  return {
    brands,
    category,
    ...(overrides ? { overrides } : {}), // TODO: Remove overrides from context: https://linear.app/trycourier/issue/C-4671/refactor-improve-and-simplify-context
    content: notification,
    dryRunKey: request?.dryRunKey,
    environment,
    metadata: message.metadata,
    preferences,
    profile,
    providers,
    scope: request?.scope!,
    tenant,
    variableData,
    ...routing,
    timeouts,
  };
}
