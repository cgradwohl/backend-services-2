import { ISendMessageContext } from "~/send/types";
import isNotificationWire from "~/send/utils/is-notification-wire";
import { IRoutingSummary } from "../types";
import { generateRoutingSummary } from "./generate-routing-summary";
import { getTemplateV1RoutingSummary } from "~/lib/send-routing";

/** @deprecated Remove after failover hits GA */
export async function getRoutingSummary(
  context: ISendMessageContext
): Promise<Partial<IRoutingSummary>[]> {
  if (!!context.strategy) {
    return generateRoutingSummary({
      providerConfigs: context.providers,
      strategy: context.strategy,
      notification: isNotificationWire(context.content)
        ? context.content
        : undefined,
      params: {
        data: context.data,
        profile: context.profile,
      },
      tokens: context.variableData?.tokens,
    });
  }

  if (isNotificationWire(context.content)) {
    const result = await getTemplateV1RoutingSummary({
      category: context.category,
      templateV1: context.content,
      preferences: context.preferences,
      providers: context.providers,
      variableData: context.variableData,
      tokens: context.variableData?.tokens,
    });
    return [...result.always, ...result.bestOf];
  }

  return [];
}
