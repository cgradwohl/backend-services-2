import Expo, { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import {
  updateTokenStatuses,
  getTokensForProvider,
  standardProfileTokenExtractor,
} from "~/lib/token-storage";
import { ProviderResponseError } from "../errors";
import { DeliveryHandler } from "../types";
import { ticketStatusTokenMapper } from "./token-helpers";

const expo = new Expo();

const send: DeliveryHandler = async (params, template) => {
  const { override, variableHandler } = params;
  try {
    const { tokens, isManaged: isManagedTokens } = await getTokensForProvider({
      params,
      providerKey: "expo",
      profileTokenExtractor: (profile) =>
        standardProfileTokenExtractor("expo", profile),
    });

    if (
      !tokens.every((t) => {
        return typeof t === "string" && Expo.isExpoPushToken(t);
      })
    ) {
      throw new Error("Invalid Expo push token");
    }
    const variableData = variableHandler.getRootValue();

    const messageData = {
      body: template.body,
      data: {
        ...variableData.data,
        clickAction: template.clickAction,
      },
      subtitle: template.subtitle,
      title: template.title,
      ...override, // allow devs to override
    };

    if (params?.channelTrackingUrl) {
      messageData.data = {
        trackingUrl: params.channelTrackingUrl,
        ...messageData.data,
      };
    }

    const messages: ExpoPushMessage[] = tokens.map((to) => ({
      ...messageData,
      to,
    }));

    // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
    const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(
      messages
    );

    if (isManagedTokens) {
      await updateTokenStatuses({
        results: ticketStatusTokenMapper(tickets, tokens),
        tenantId: params.tenantId,
      }).catch((e) => console.warn(e));
    }

    /*
      From Expo response format link above:
      Note: You should check the ticket for each notification to determine if there was a problem
      delivering it to Expo.In particular, do not assume a 200 HTTP status code means your notifications
      were sent successfully; the granularity of push notification errors is finer than that of HTTP statuses.

      If one or more tickets succeed, the notification was sent to the recipient. As such, we consider the
      notification successful. otherwise, the notification should be marked as failed.
    */

    if (tickets.every((t) => t.status === "error")) {
      throw new ProviderResponseError("All Tickets Failed to Send.", tickets);
    }

    return tickets;
  } catch (err) {
    if (err instanceof ProviderResponseError) {
      throw err;
    }

    throw new ProviderResponseError(err);
  }
};

export default send;
