import { ExpoPushTicket } from "expo-server-sdk";
import { TokenUsageResult } from "~/lib/token-storage";

// https://docs.expo.dev/push-notifications/sending-notifications/#push-tickets
export function ticketStatusTokenMapper(
  tickets: ExpoPushTicket[],
  tokens: string[]
): TokenUsageResult[] {
  return tickets.map((ticket, index) => {
    if (
      ticket.status === "ok" ||
      ticket.details?.error !== "DeviceNotRegistered"
    ) {
      return {
        status: "active",
        token: tokens[index],
      };
    }

    return {
      status: "failed",
      token: tokens[index],
      reason: "DeviceNotRegistered",
    };
  });
}
