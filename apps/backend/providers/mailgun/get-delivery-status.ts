import axios, { AxiosResponse } from "axios";

import { match } from "typescript-pattern-matching";
import createSentDeliveryStatusWithTtl from "~/lib/create-sent-delivery-status-with-ttl";
import {
  MessageStatusReason,
  MessageStatusReasonCode,
} from "~/lib/message-service/types";
import { CheckDeliveryStatusError, ProviderResponseError } from "../errors";
import { DeliveryStatus, GetDeliveryStatusFn } from "../types";
import {
  IMailgunEventLog,
  IMailgunFailedEventLog,
  IMailgunRejectedEventLog,
  MailgunEvent,
} from "./types";

const DELIVERED_TYPES: readonly MailgunEvent[] = [
  "delivered",
  "complained",
  "opened",
  "clicked",
  "unsubscribed",
];
const SENT_TYPES: readonly MailgunEvent[] = ["accepted", "stored"];
const UNDELIVERABLE_TYPES: readonly MailgunEvent[] = ["rejected"];
// Has two types of severities -> leads to either SENT or UNDELIVERABLE
const FAILED_TYPES: readonly MailgunEvent[] = ["failed"];

/*
  Makes a call against their Events API (https://documentation.mailgun.com/en/latest/api-events.html#events).
  The response returns an array of events for a given message.
  The array contains at least one event that we can map to our Delivery Status.
  The array can take anywhere from seconds to 8+ hours because Mailgun uses
  eventual consistency to update their read views.
*/
const getDeliveryStatus: GetDeliveryStatusFn = async (
  externalId,
  configuration,
  _
) => {
  const { apiKey, domain } = configuration.json as unknown as {
    apiKey: string;
    domain: string;
  };
  if (!apiKey) {
    throw new CheckDeliveryStatusError(
      "Unable to find apiKey for mailgun configuration."
    );
  }

  if (!domain) {
    throw new CheckDeliveryStatusError(
      "Unable to find domain for mailgun configuration."
    );
  }

  const parsedDomain = domain.replace("https://api.mailgun.net/v3/", "");

  let response: AxiosResponse<{ items: IMailgunEventLog[] }>;
  try {
    response = await axios({
      auth: {
        password: apiKey,
        username: "api",
      },
      baseURL: "https://api.mailgun.net",
      method: "GET",
      params: {
        "message-id": externalId,
      },
      timeout: 10000, // 10 seconds
      url: `v3/${parsedDomain}/events`,
    });
  } catch (err) {
    // The request timed out.
    if (err.code && err.code === "ECONNABORTED") {
      return createSentDeliveryStatusWithTtl({ reason: "API Timeout" });
    }

    if (err.response && err.response.status >= 500) {
      return createSentDeliveryStatusWithTtl();
    }

    throw new ProviderResponseError(err);
  }

  const {
    data: { items },
  }: { data: { items: IMailgunEventLog[] } } = response;

  if (!items.length) {
    return { status: "SENT", response: { reason: "items array is empty." } };
  }

  const sortedItems = items.sort(({ timestamp: a }, { timestamp: b }) => b - a);
  const deliveredEvent = sortedItems.find(({ event }) =>
    DELIVERED_TYPES.includes(event)
  );
  const sentEvent = sortedItems.find(({ event }) => SENT_TYPES.includes(event));
  const failedEvent = sortedItems.find(({ event }) =>
    FAILED_TYPES.includes(event)
  );
  const undeliverableEvent = sortedItems.find(({ event }) =>
    UNDELIVERABLE_TYPES.includes(event)
  );
  const arg = {
    delivered: Boolean(deliveredEvent),
    failed: Boolean(failedEvent),
    sent: Boolean(sentEvent),
    undeliverable: Boolean(undeliverableEvent),
  };

  const status: DeliveryStatus = match(arg)
    .with({ delivered: true }, (): DeliveryStatus => "DELIVERED")
    .with({ sent: true }, (): DeliveryStatus => "SENT")
    .with({ undeliverable: true }, (): DeliveryStatus => "UNDELIVERABLE")
    .withWhen(
      { failed: true },
      () => (failedEvent as IMailgunFailedEventLog).severity === "temporary",
      (): DeliveryStatus => "SENT"
    )
    .withWhen(
      { failed: true },
      () => (failedEvent as IMailgunFailedEventLog).severity === "permanant",
      (): DeliveryStatus => "UNDELIVERABLE"
    )
    .run();

  let reason: MessageStatusReason;
  let reasonCode: MessageStatusReasonCode;
  let reasonDetails: string;
  if (arg.undeliverable) {
    reason = "FAILED";
    reasonDetails = (undeliverableEvent as IMailgunRejectedEventLog).reject
      .reason;
  } else if (
    arg.failed &&
    (failedEvent as IMailgunFailedEventLog).severity === "permanant"
  ) {
    const permanantFailedEvent = failedEvent as IMailgunFailedEventLog;
    reason = permanantFailedEvent.reason.includes("bounce")
      ? "BOUNCED"
      : "FAILED";
    reasonCode =
      reason === "BOUNCED"
        ? ["5.1.1", 605].includes(permanantFailedEvent["delivery-status"].code)
          ? "HARD"
          : "SOFT"
        : undefined;
    reasonDetails = permanantFailedEvent["delivery-status"].message.length
      ? permanantFailedEvent["delivery-status"].message
      : permanantFailedEvent["delivery-status"].description;
  }

  return {
    reason,
    reasonCode,
    reasonDetails,
    response: { data: response.data.items, status: response.status },
    status,
  };
};

export default getDeliveryStatus;
