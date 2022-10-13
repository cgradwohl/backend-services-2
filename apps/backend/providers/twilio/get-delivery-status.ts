import axios, { AxiosResponse } from "axios";

import createSentDeliveryStatusWithTtl from "~/lib/create-sent-delivery-status-with-ttl";
import { CheckDeliveryStatusError, ProviderResponseError } from "../errors";
import { DeliveryStatus, GetDeliveryStatusFn } from "../types";
import { IMessage } from "./types";

type Direction = IMessage["direction"];
const DIRECTION: readonly Direction[] = [
  "outbound-api",
  "outbound-call",
  "outbound-reply",
];

/*
 * There are rate limits but docs and response headers don't say what they are.
 * API Token works as is.
 * No need to upgrade plan to use messages/outbound endpoint.
 */
const getDeliveryStatus: GetDeliveryStatusFn = async (
  externalId,
  configuration,
  _
) => {
  const { accountSid, authToken } = configuration.json as unknown as {
    accountSid: string;
    authToken: string;
  };
  if (!accountSid) {
    throw new CheckDeliveryStatusError(
      "Unable to find accountSid for twilio configuration."
    );
  }

  if (!authToken) {
    throw new CheckDeliveryStatusError(
      "Unable to find authToken for twilio configuration."
    );
  }

  let response: AxiosResponse<IMessage>;
  try {
    // Uses https://www.twilio.com/docs/sms/api/message-resource#fetch-a-message-resource.
    response = await axios({
      auth: {
        password: authToken,
        username: accountSid,
      },
      baseURL: "https://api.twilio.com/2010-04-01/",
      method: "GET",
      timeout: 10000, // 10 seconds
      url: `/Accounts/${accountSid}/Messages/${externalId}.json`,
    });
  } catch (err) {
    // The request timed out.
    if (err.code && err.code === "ECONNABORTED") {
      return createSentDeliveryStatusWithTtl({ reason: "API Timeout" });
    }

    // Twilio has a rate limits not found in their docs or response headers (429).
    // Twilio endpoint errors when they are down or have processing errors (500, 503).
    // Include a TTL of two minutes after now.
    if (err.response && [429, 500, 503].includes(err.response.status)) {
      return createSentDeliveryStatusWithTtl();
    }

    throw new ProviderResponseError(err);
  }

  const { data }: { data: IMessage } = response;

  // Somehow our message was an inbound message.
  if (!DIRECTION.includes(data.direction)) {
    return {
      reason: "Message status represents an inbound message",
      response: { data: response.data, status: response.status },
      status: "UNDELIVERABLE",
    };
  }

  let status: DeliveryStatus;
  let reason: string;

  switch (data.status) {
    case "delivered":
      status = "DELIVERED";
      break;
    case "accepted":
    case "queued":
    case "sending":
    case "sent":
      status = "SENT";
      break;
    case "failed":
    case "undelivered":
      status = "UNDELIVERABLE";
      reason = `Error Code ${data.error_code}: ${data.error_message}`;
      break;
    default:
      status = "UNDELIVERABLE";
      reason = `Unknown status: ${data.status}.`;
  }

  return {
    reason,
    response: { data: response.data, status: response.status },
    status,
  };
};

export default getDeliveryStatus;
