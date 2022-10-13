import axios, { AxiosResponse } from "axios";
import { match } from "typescript-pattern-matching";

import createSentDeliveryStatusWithTtl from "~/lib/create-sent-delivery-status-with-ttl";
import { CheckDeliveryStatusError, ProviderResponseError } from "../errors";
import { DeliveryStatus, GetDeliveryStatusFn } from "../types";
import { IMandrillErrorResponse, IMandrillInfoResponse } from "./types";

/*
 * API Token works as is.
 * No need to upgrade plan to use messages/outbound endpoint.
 * From testing, none of the dozen test messages had SMTP events in the first 90 minutes.
 */
const getDeliveryStatus: GetDeliveryStatusFn = async (
  externalId,
  configuration,
  _
) => {
  const { apiKey } = configuration.json as unknown as {
    apiKey: string;
  };
  if (!apiKey) {
    throw new CheckDeliveryStatusError(
      "Unable to find apiKey for mandrill configuration."
    );
  }

  let response: AxiosResponse<IMandrillInfoResponse>;
  try {
    // Uses https://mandrillapp.com/api/docs/messages.JSON.html#method=info.
    response = await axios({
      baseURL: "https://mandrillapp.com/api/1.0/",
      data: {
        id: externalId,
        key: apiKey,
      },
      method: "POST",
      timeout: 10000, // 10 seconds
      url: "messages/info.json",
    });
  } catch (err) {
    // The request timed out.
    if (err.code && err.code === "ECONNABORTED") {
      return createSentDeliveryStatusWithTtl({ reason: "API Timeout" });
    }

    // Retry GeneralErrors and Unknown_Message with a TTL.
    if (err?.response?.status === 500) {
      const errResponse: IMandrillErrorResponse = err?.response.data;
      if (["GeneralError", "Unknown_Message"].includes(errResponse.name)) {
        return createSentDeliveryStatusWithTtl();
      }
    }

    throw new ProviderResponseError(err);
  }

  const { smtp_events: events }: IMandrillInfoResponse = response.data;
  if (!events.length) {
    return { status: "SENT" };
  }

  // https://mandrill.zendesk.com/hc/en-us/articles/360039293753-How-to-Confirm-if-an-Email-Was-Actually-Delivered
  const sortedEvents = events.sort(({ ts: a }, { ts: b }) => b - a);
  const deliveredEvent = sortedEvents.find(({ diag }) => diag.startsWith("2"));
  const undeliverableEvent = sortedEvents.find(({ diag }) =>
    diag.startsWith("5")
  );
  const temporarySentFailEvent = sortedEvents.find(({ diag }) =>
    diag.startsWith("4")
  );

  const arg = {
    delivered: Boolean(deliveredEvent),
    sent: Boolean(temporarySentFailEvent),
    undeliverable: Boolean(undeliverableEvent),
  };

  const status: DeliveryStatus = match(arg)
    .with({ delivered: true }, (): DeliveryStatus => "DELIVERED")
    .with({ undeliverable: true }, (): DeliveryStatus => "UNDELIVERABLE")
    .with({ sent: true }, (): DeliveryStatus => "SENT")
    .run();

  const reason = arg.undeliverable ? undeliverableEvent.diag : undefined;

  return {
    reason,
    response: { data: response.data, status: response.status },
    status,
  };
};

export default getDeliveryStatus;
