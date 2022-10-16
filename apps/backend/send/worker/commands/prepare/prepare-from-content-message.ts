import { nanoid } from "nanoid";
import { ContentMessage, UserRecipient } from "~/api/send/types";
import { listProviders } from "~/lib/configurations-service";
import { createUnroutableEvent } from "~/lib/dynamo/event-logs";
import { generateTrackingId } from "~/lib/tracking-service/generate-tracking-id";
import { Environment, ISendMessageContext } from "~/send/types";
import { ITenant } from "~/types.api";
import { getMessageBrands } from "./get-brand";
import { getOverrides } from "./get-overrides";
import { getVariableData } from "./get-variables";
import getPublishedState from "~/send/utils/get-published-state";
import getCategory from "./get-category";
import getUserPreferences from "./get-user-preferences";
import loadProfile from "./load-profile";
import { getTokens } from "./get-tokens";
import { RequestPayload } from "~/send/service/data/request/request.types";
import { buildUtmMap } from "../../provider-render/augment-href";
import { getRoutingTree } from "./get-routing";
import { getTimeoutTable } from "~/lib/send-routing";
import { extendRoutingStrategy } from "./extend-routing-strategy";
import { findPricingPlanForTenant } from "~/lib/plan-pricing";

export async function prepareFromContentMessage({
  tenant,
  message,
  messageId,
  request,
  environment,
  data,
}: {
  tenant: ITenant;
  messageId: string;
  message: ContentMessage;
  request?: RequestPayload;
  environment: Environment;
  data: Record<string, unknown>;
}): Promise<ISendMessageContext | undefined> {
  const tenantId = tenant.tenantId;
  const to = message.to as UserRecipient;
  const requestLevelPreferences = "preferences" in to && to.preferences;

  // savedProfile has recipient preferences set using preferences API
  const [providers, { profile, savedProfile }] = await Promise.all([
    listProviders(tenantId),
    loadProfile({
      messageId,
      tenantId,
      to: message.to as UserRecipient,
    }),
  ]);

  if (!providers?.length) {
    await createUnroutableEvent(
      tenantId,
      messageId,
      "NO_PROVIDERS",
      "No providers added"
    );
    return;
  }

  const overrides = getOverrides(message);

  const [preferences, strategy, category, brands, tokens] = await Promise.all([
    getUserPreferences(
      savedProfile ?? {
        id: to?.user_id,
      },
      tenantId,
      requestLevelPreferences
    ),
    extendRoutingStrategy(message, tenantId),
    getCategory(message.content),
    getMessageBrands({
      mainBrandId: message.brand_id,
      channels: message.channels,
      scope: request?.scope!,
      tenantId,
      emailOverride: overrides?.brand,
      inlineBrand: message.brand,
    }),
    getTokens({ userId: to.user_id, tenantId }),
  ]);

  const openTrackingId = generateTrackingId();
  const unsubscribeTrackingId = generateTrackingId();

  const userId =
    "user_id" in message.to ? message.to.user_id : `anon_${nanoid()}`;

  const utmMap = buildUtmMap({ message });

  const variableData = await getVariableData({
    messageId,
    data,
    emailOpenTracking: tenant?.emailOpenTracking?.enabled!,
    environment,
    event: message.metadata?.event,
    openTrackingId,
    unsubscribeTrackingId,
    profile,
    recipientId: userId!,
    scope: getPublishedState(request?.scope!),
    tenantId: tenant.tenantId,
    utmMap,
  });

  const routing = await getRoutingTree({
    message,
    tenantId,
    profile,
    tokens,
    providerConfigs: providers,
    strategy,
    variableData,
  });

  const timeouts = getTimeoutTable({
    timeout: message.timeout,
    channels: strategy.channels,
    providers: strategy.providers,
    plan: findPricingPlanForTenant(tenant),
  });

  return {
    brands,
    category,
    channels: message.channels,
    content: message.content,
    data,
    dryRunKey: request?.dryRunKey,
    environment,
    metadata: message.metadata,
    overrides,
    preferences,
    profile,
    providers,
    scope: request?.scope!,
    ...routing,
    tenant,
    variableData,
    timeouts,
  };
}
