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
  IPostmark422Response,
  IPostmarkMessageDetails,
  IPostmarkMessageEvent,
  PostmarkResponse,
} from "./types";

type MessageEventType = IPostmarkMessageEvent["Type"];
const DELIVERED_TYPES: readonly MessageEventType[] = [
  "Delivered",
  "LinkClicked",
  "Opened",
];

const url = "https://api.postmarkapp.com/";

function assertIsPostmarkMessageDetails(
  data: PostmarkResponse
): asserts data is IPostmarkMessageDetails {
  if (!("MessageID" in data)) {
    throw new Error("Received an unexpected response from Postmark");
  }
}

const getReasonDetails = async (
  apiKey: string,
  bounceId: string
): Promise<{
  reason?: "BOUNCED" | "FAILED";
  reasonCode?: MessageStatusReasonCode;
  reasonDetails?: string;
}> => {
  try {
    const response = await axios({
      baseURL: url,
      headers: {
        "X-Postmark-Server-Token": apiKey,
      },
      method: "GET",
      timeout: 5000, // 5 seconds
      url: `bounces/${bounceId}`,
    });

    // Based on https://postmarkapp.com/developer/api/bounce-api#bounce-types.
    const reason = ["HardBounce", "SoftBounce"].includes(response.data.type)
      ? "BOUNCED"
      : "FAILED";

    const reasonCode = response.data.Type === "HardBounce" ? "HARD" : "SOFT";

    return { reason, reasonCode, reasonDetails: response.data.Details };
  } catch (err) {
    return {};
  }
};

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
  const { apiKey } = configuration.json as unknown as {
    apiKey: string;
  };
  if (!apiKey) {
    throw new CheckDeliveryStatusError(
      "Unable to find apiKey for postmark configuration."
    );
  }

  let response: AxiosResponse<PostmarkResponse>;
  try {
    // Uses https://postmarkapp.com/developer/api/messages-api#outbound-message-details.
    response = await axios({
      baseURL: url,
      headers: {
        "X-Postmark-Server-Token": apiKey,
      },
      method: "GET",
      timeout: 10000, // 10 seconds
      url: `messages/outbound/${externalId}/details`,
      // 422 returns reponse of type IPostmark422Response that requires analysis.
      // See https://postmarkapp.com/developer/api/overview#error-codes.
      validateStatus: (responseStatus: number) => {
        return (
          (responseStatus >= 200 && responseStatus < 300) ||
          responseStatus === 422
        );
      },
    });
  } catch (err) {
    // The request timed out.
    if (err.code && err.code === "ECONNABORTED") {
      return createSentDeliveryStatusWithTtl({ reason: "API Timeout" });
    }

    // Postmark has a rate limits not found in their docs or response headers (429).
    // Postmark endpoint errors when they are down or have processing errors (500, 503).
    // Include a TTL of two minutes after now.
    if (err.response && [429, 500, 503].includes(err.response.status)) {
      return createSentDeliveryStatusWithTtl();
    }

    throw new ProviderResponseError(err);
  }

  /*
    ErrorCode 701 means message does not exist.
    It usually needs means Postmark hasn't updated their message details yet.
  */
  const { curatedData, isSent, pattern } = match<
    PostmarkResponse,
    {
      isSent: boolean;
      pattern?: string;
      curatedData?: Partial<IPostmarkMessageDetails>;
    }
  >(response.data)
    .with({ ErrorCode: 701 }, () => ({
      isSent: true,
      pattern: "ErrorCode 701",
    }))
    .with({ ErrorCode: Number }, (x: IPostmark422Response) => {
      throw new ProviderResponseError(x.Message, x);
    })
    .with(
      { MessageEvents: [{ Type: undefined }] },
      ({
        MessageEvents,
        MessageID,
        ReceivedAt,
        Status,
      }: IPostmarkMessageDetails) => ({
        curatedData: {
          MessageEvents,
          MessageID,
          ReceivedAt,
          Status,
        },
        isSent: true,
        pattern: "MessageEvents array empty.",
      })
    )
    .with(
      { MessageEvents: [{ Type: "Transient" }] },
      ({
        MessageEvents,
        MessageID,
        ReceivedAt,
        Status,
      }: IPostmarkMessageDetails) => ({
        curatedData: {
          MessageEvents,
          MessageID,
          ReceivedAt,
          Status,
        },
        isSent: true,
        pattern: "Only Transient event found",
      })
    )
    .with({ MessageEvents: [{ Type: String }] }, () => ({ isSent: false }))
    .run();

  if (isSent) {
    return {
      response: { data: curatedData, reason: pattern },
      status: "SENT",
    };
  }

  const { data } = response;
  assertIsPostmarkMessageDetails(data);

  const sortedItems = data.MessageEvents.sort(
    ({ ReceivedAt: a }, { ReceivedAt: b }) =>
      new Date(b).getTime() - new Date(a).getTime()
  );
  const deliveredEvent = sortedItems.find(({ Type }) =>
    DELIVERED_TYPES.includes(Type)
  );
  const undeliverableEvent = sortedItems.find(({ Type }) => Type === "Bounced");
  const arg = {
    delivered: Boolean(deliveredEvent),
    undeliverable: Boolean(undeliverableEvent),
  };

  const status: DeliveryStatus = match(arg)
    .with({ delivered: true }, (): DeliveryStatus => "DELIVERED")
    .with({ undeliverable: true }, (): DeliveryStatus => "UNDELIVERABLE")
    .run();

  let reason: MessageStatusReason;
  let reasonCode: MessageStatusReasonCode;
  let reasonDetails: string;
  if (arg.undeliverable) {
    const {
      reason: r,
      reasonCode: rc,
      reasonDetails: rd,
    } = await getReasonDetails(apiKey, undeliverableEvent.Details.BounceID);

    reason = r ?? "BOUNCED";
    reasonCode = rc;
    reasonDetails = rd ?? undeliverableEvent.Details.Summary;
  }

  return {
    reason,
    reasonCode,
    reasonDetails,
    response: { data: response.data, status: response.status },
    status,
  };
};

export default getDeliveryStatus;
