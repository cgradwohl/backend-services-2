import axios, { AxiosResponse } from "axios";

import { replace as replaceConfiguration } from "~/lib/configurations-service";
import createSentDeliveryStatusWithTtl from "~/lib/create-sent-delivery-status-with-ttl";
import {
  MessageStatusReason,
  MessageStatusReasonCode,
} from "~/lib/message-service/types";
import { CheckDeliveryStatusError, ProviderResponseError } from "../errors";
import { DeliveryStatus, GetDeliveryStatusFn } from "../types";

interface ISendGridResponse {
  msg_id: string;
  reason?: string;
  status: string;
}

const url = "https://api.sendgrid.com/";

const getReasonDetails = async (apiKey: string, id: string) => {
  try {
    const { data } = await axios({
      baseURL: url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
      timeout: 5000, // 5 seconds
      url: `v3/messages/${id}`,
    });

    const lastEvent = data?.events?.slice(-1);

    return {
      reasonCode: (["blocked", "bounce"].includes(lastEvent?.bounce_type)
        ? "HARD"
        : "SOFT") as MessageStatusReasonCode,
      reasonDetails: lastEvent?.reason,
    };
  } catch (err) {
    return {};
  }
};

const getDeliveryStatus: GetDeliveryStatusFn = async (
  externalId,
  configuration,
  tenantId
) => {
  const { apiKey } = configuration.json as unknown as { apiKey: string };
  if (!apiKey) {
    throw new CheckDeliveryStatusError(
      "Unable to find apiKey for sendgrid configuration."
    );
  }

  let response: AxiosResponse<{
    messages: ISendGridResponse[];
  }>;
  try {
    response = await axios({
      baseURL: url,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
      params: {
        limit: 1,
        query: `(unique_args["courier-tracking-id"]="${externalId}")`,
      },
      timeout: 10000, // 10 seconds
      url: `v3/messages`,
    });
  } catch (err) {
    // The request timed out.
    if (err.code && err.code === "ECONNABORTED") {
      return createSentDeliveryStatusWithTtl({ reason: "API Timeout" });
    }

    // The account for the apiKey does not have email activity enabled (401).
    // The account for the apiKey has email activity enabled,
    // but does not have access to hit the endpoint (403).
    // Turn off the flag for the config to short circuit other messages and stop the checks.
    if (err.response && [400, 401, 403].includes(err.response.status)) {
      const newConfiguration = {
        ...configuration,
        json: {
          ...configuration.json,
          checkDeliveryStatus: false,
          deliveryTrackingDisabledByCourier: true,
        },
      };

      await replaceConfiguration(
        { id: configuration.id, tenantId, userId: configuration.updater },
        newConfiguration
      );

      const stopRetryReason = `SG returned ${err.response.status} when checking for the message's activity. Configuration ${configuration.id} has checkDeliveryStatus set to false.`;

      return {
        response: { data: err.response.data, reason: stopRetryReason },
        status: "SENT_NO_RETRY",
      };
    }

    // SG has a rate limit of 10 requests for every two minutes (429).
    // SG's endpoint errors out when strained and will time out (503).
    // Include a TTL of two minutes after now.
    if (err.response && [429, 503].includes(err.response.status)) {
      return createSentDeliveryStatusWithTtl({
        reason: `API responded with ${err.response.status} status`,
      });
    } else {
      const payload = err.config
        ? {
            params: err.config.params,
            partialApiKey: `SG.***${err.config.headers.Authorization.slice(
              -8
            )}`,
            url: err.config.url,
          }
        : undefined;
      throw new ProviderResponseError(err, payload);
    }
  }

  const {
    data: {
      messages: [data],
    },
  } = response;

  // The event usually appears two minutes after sending the email.
  if (!data) {
    return { status: "SENT", response: { reason: "messages array empty." } };
  }

  let status: DeliveryStatus;
  let reason: MessageStatusReason;
  let reasonCode: MessageStatusReasonCode;
  let reasonDetails: string;

  // From: https://sendgrid.com/docs/for-developers/tracking-events/event/#delivery-events
  switch (data.status) {
    case "clicked":
    case "delivered":
    case "group_resubscribe":
    case "group_unsubscribe":
    case "open":
    case "spamreport":
    case "unsubscribe":
      status = "DELIVERED";
      break;
    case "deferred":
    case "processed":
      status = "SENT";
      break;
    case "bounce":
    case "not_delivered":
      status = "UNDELIVERABLE";
      reason = "BOUNCED";
      const { reasonCode: rc, reasonDetails: rd } = await getReasonDetails(
        apiKey,
        data.msg_id
      );
      reasonCode = rc;
      reasonDetails = rd;
      break;
    case "blocked":
    case "dropped":
    default:
      status = "UNDELIVERABLE";
      reason = "FAILED";
      break;
  }

  return {
    reason,
    reasonCode,
    reasonDetails: reasonDetails ?? data.reason,
    response: { data: response.data, status: response.status },
    status,
  };
};

export default getDeliveryStatus;
