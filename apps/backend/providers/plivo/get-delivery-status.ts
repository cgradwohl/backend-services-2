import axios, { AxiosResponse } from "axios";

import createSentDeliveryStatusWithTtl from "~/lib/create-sent-delivery-status-with-ttl";
import log from "~/lib/log";
import { CheckDeliveryStatusError, ProviderResponseError } from "../errors";
import { DeliveryStatus, GetDeliveryStatusFn } from "../types";
import { IMessage } from "./types";

const getDeliveryStatus: GetDeliveryStatusFn = async (
  externalId,
  configuration,
  _
) => {
  const { authId, authToken } = configuration.json as unknown as {
    authId: string;
    authToken: string;
  };
  if (!authId) {
    throw new CheckDeliveryStatusError(
      "Unable to find authId for plivo configuration."
    );
  }

  if (!authToken) {
    throw new CheckDeliveryStatusError(
      "Unable to find authToken for plivo configuration."
    );
  }

  let response: AxiosResponse<IMessage>;
  try {
    // Uses https://www.plivo.com/docs/sms/api/message#retrieve-a-message.
    response = await axios({
      auth: {
        password: authToken,
        username: authId,
      },
      baseURL: "https://api.plivo.com/v1/",
      method: "GET",
      timeout: 10000, // 10 seconds
      url: `/Account/${authId}/Message/${externalId}`,
    });
  } catch (err) {
    // The request timed out.
    if (err.code && err.code === "ECONNABORTED") {
      return createSentDeliveryStatusWithTtl({ reason: "API Timeout" });
    }

    // Possible message isn't ready for delivery check right away (404).
    // Plivo endpoint errors when they are down or have processing errors (500).
    // Include a TTL of two minutes after now.
    if (err.response && [404, 500].includes(err.response.status)) {
      return createSentDeliveryStatusWithTtl();
    }

    throw new ProviderResponseError(err);
  }

  const { data }: { data: IMessage } = response;

  let status: DeliveryStatus;
  let reason: string;

  switch (data.message_state) {
    case "delivered":
      status = "DELIVERED";
      break;
    case "queued":
    case "received":
    case "sent":
      status = "SENT";
      break;
    case "failed":
    case "rejected":
    case "undelivered":
      status = "UNDELIVERABLE";
      reason = `${data.error_code}: ${data.message_state}`;
      break;
    default:
      status = "UNDELIVERABLE";
      reason = `Unknown status: ${data.error_code}.`;
  }

  return {
    reason,
    response: { data: response.data, status: response.status },
    status,
  };
};

export default getDeliveryStatus;
