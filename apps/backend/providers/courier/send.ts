import {
  ElementalActionNode,
  ElementalTextNode,
} from "./../../api/send/types/courier-elemental";
import axios from "axios";
import { createHmac } from "crypto";
import getTenantAuthTokens from "~/lib/tenant-service/list-api-keys";
import {
  ApiSendRequestCourierOverrideInstance,
  ApiSendRequestOverrideChannel,
} from "~/types.public";
import { handleSendError, ProviderResponseError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandlerParams } from "../types";
import { CourierProfile } from "./handles";

export type CourierDeliveryHandlerParams = Omit<
  DeliveryHandlerParams,
  "override"
> & {
  override?: ApiSendRequestCourierOverrideInstance;
};

interface ITextBlock {
  type: "text";
  text: string;
}
interface IActionBlock {
  text: string;
  url: string;
  type: "action";
}
interface CourierTemplates {
  blocks?: Array<ITextBlock | IActionBlock>;
  body?: string;
  title?: string;
  preview?: string;
  elemental?: Array<ElementalActionNode | ElementalTextNode>;
  html?: string;
  icon?: string;
  data?: {
    [key: string]: any;
  };
}

const send = async (
  params: CourierDeliveryHandlerParams,
  templates: CourierTemplates
) => {
  if (params?.channel?.taxonomy === "banner:courier") {
    return {
      status: "not implemented",
    };
  }

  const isInboxChannel = params?.channel?.taxonomy === "inbox:courier";
  const fullTenantId = params.tenantId;
  const courierProfile = params?.profile as CourierProfile;
  const recipient =
    typeof courierProfile?.courier === "string"
      ? (params?.profile?.courier as string)
      : courierProfile?.courier?.channel;

  const clientKey = Buffer.from(fullTenantId).toString("base64");

  const channelOverrides =
    params?.channelOverride as ApiSendRequestOverrideChannel["channel"]["push"];
  const providerOverrides = params?.override;

  templates.data = {
    ...(channelOverrides?.data ?? {}),
    ...(providerOverrides?.data ?? {}),
    brandId: params?.brand?.id,
    trackingIds: params.trackingIds,
    trackingUrl: params.channelTrackingUrl,
  };

  if (channelOverrides?.title) {
    templates.title = channelOverrides.title;
  }

  if (channelOverrides?.body) {
    templates.body = channelOverrides.body;
  }

  if (providerOverrides?.title) {
    templates.title = providerOverrides.title;
  }

  if (providerOverrides?.body) {
    templates.body = providerOverrides.body;
  }

  const [tenantId, environment = "production"] = fullTenantId.split("/");
  const scope = `published/${environment}`;

  const authTokens = await getTenantAuthTokens(tenantId);
  const token = authTokens.find(({ scope: s }) => s === scope);
  const authToken = token?.authToken;

  if (!authToken) {
    throw new ProviderResponseError(
      "Could not find any API key associated with the tenant"
    );
  }

  const signature = createHmac("sha256", authToken)
    .update(recipient)
    .digest("hex");

  try {
    const res = await axios.post(
      `${process.env.IN_APP_API_URL}${isInboxChannel ? "/inbox" : "/send"}`,
      {
        channel: recipient,
        event: params.eventId,
        message: templates,
        messageId: params.messageId,
        tags: params.tags,
      },
      {
        headers: {
          "x-courier-client-key": clientKey,
          "x-courier-user-signature": signature,
          "x-courier-user-id": recipient,
        },
        timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
        timeoutErrorMessage: "Courier In-App API request timed out.",
      }
    );

    return {
      providerRequest: {
        channel: recipient,
        event: params.eventId,
        message: templates,
        messageId: params.messageId,
        tags: params.tags,
      },
      providerResponse: res.data,
    };
    return res.data;
  } catch (err) {
    handleSendError(err);
  }
};

export default send;
