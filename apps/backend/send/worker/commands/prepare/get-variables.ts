import { TimeoutDateEpochSeconds, UTMMap } from "~/api/send/types";
import { toApiKey } from "~/lib/api-key-uuid";
import {
  generateOpenedLink,
  generateUnsubscribeTrackingIdLink,
  generateHostedPreferencesLink,
} from "~/lib/generate-tracking-links";
import { RecipientToken } from "~/lib/token-storage";
import { getTrackingDomain } from "~/lib/tracking-domains";
import { Environment, ISendMessageContext, PublishedState } from "~/send/types";
import { IProfile } from "~/types.api";

export interface VariableData {
  data?: Record<string, any>;
  emailOpenTracking: boolean;
  environment: Environment;
  event?: string;
  openTrackingId: string;
  unsubscribeTrackingId: string;
  profile: IProfile;
  recipientId: string;
  scope: PublishedState;
  template?: string;
  tenantId: string;
  urls?: {
    opened?: string;
    unsubscribe?: string | null;
    preferences?: string;
  };
  utmMap?: UTMMap;
  messageId: string;
}

export async function getVariableData(
  {
    data,
    emailOpenTracking,
    environment,
    event,
    openTrackingId,
    unsubscribeTrackingId,
    profile,
    scope,
    template,
    tenantId,
    utmMap,
    recipientId,
    messageId,
  }: VariableData,
  brandId?: string
): Promise<ISendMessageContext["variableData"]> {
  const trackingDomain = await getTrackingDomain(tenantId);
  const unsubscribeId = event ?? template;

  return {
    courier: {
      environment,
      scope,
    },
    data,
    openTrackingId,
    unsubscribeTrackingId,
    profile,
    event: event ?? template,
    template,
    messageId,
    recipient: recipientId,
    urls: {
      opened: emailOpenTracking
        ? generateOpenedLink(tenantId, openTrackingId, trackingDomain)
        : null,
      unsubscribe: unsubscribeId
        ? generateUnsubscribeTrackingIdLink(
            tenantId,
            unsubscribeTrackingId,
            trackingDomain
          )
        : undefined,
      preferences: generateHostedPreferencesLink(
        tenantId,
        toApiKey(brandId, { noDashes: true }),
        profile.userId ?? recipientId
      ),
    },
    utmMap,
  };
}
