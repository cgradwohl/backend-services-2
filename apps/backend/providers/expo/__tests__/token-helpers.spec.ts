import { ExpoPushTicket } from "expo-server-sdk";
import { ticketStatusTokenMapper } from "../token-helpers";

describe("expo token helpers", () => {
  describe("ticketStatusTokenMapper", () => {
    const tokens = [
      "ExponentPushToken[Wqhbr1LaFiQpJU6mIHQYD3]",
      "ExponentPushToken[Lahbr1LaQiMpJU6mIHQYD6]",
    ];
    const tickets: ExpoPushTicket[] = [
      {
        status: "ok",
        id: "e501843d-bf1c-4be9-8a1e-9a0b1e642143",
      },
      {
        status: "error",
        message:
          '"ExponentPushToken[Lahbr1LaQiMpJU6mIHQYD6]" is not a registered push notification recipient',
        details: {
          error: "DeviceNotRegistered",
        },
      },
    ];

    it("should return a list of token usage results", () => {
      const results = ticketStatusTokenMapper(tickets, tokens);
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe("active");
      expect(results[0].token).toBe(tokens[0]);
      expect(results[1].status).toBe("failed");
      expect(results[1].token).toBe(tokens[1]);
      expect(results[1].reason).toBe("DeviceNotRegistered");
    });
  });
});
