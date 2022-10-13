import * as dynamo from "~/lib/dynamo";
import {
  create,
  incrementErrorCount,
  markClicked,
  markDelivered,
  markEmail,
  markOpened,
  markRead,
  markSent,
  markSimulated,
  markUndeliverable,
  markUndeliverableFromDelivery,
  markUnmapped,
  markUnread,
  setBilledUnits,
  setNotificationId,
} from "~/lib/dynamo/messages";
import { markUnroutable } from "~/lib/dynamo/messages-v3-adapter";
import { shouldMarkUndeliverable } from "~/lib/dynamo/should-mark-undeliverable";
import {
  IMessageHistory,
  IRoutedMessageHistory,
  IUndeliverableMessageHistory,
  MessageHistoryType,
  RoutedMessageHistoryTypes,
} from "~/lib/message-service/types";

jest.mock("~/lib/dynamo", () => {
  return {
    put: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
  };
});

jest.mock("~/lib/get-environment-variable");

jest.mock("~/lib/get-hash-from-range", () => ({
  getHashFromRange: jest.fn().mockReturnValue(1),
}));

jest.mock("~/providers", () => {
  return {
    providerWithDelivery: {
      deliveryStatusStrategy: "polling",
    },
    providerWithoutDelivery: {},
  };
});

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

describe("lib/messages", () => {
  describe("v3", () => {
    const OLD_ENV = { ...process.env };

    afterAll(() => {
      process.env = { ...OLD_ENV };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    beforeEach(() => {
      process.env.PREFIX = "jest-mock-table-name";
      process.env.MESSAGES_V3_TABLE = "jest-mock-table-name-messages-v3";

      Date.now = jest.fn(() => 1632426903638);
      jest.resetModules();
    });

    it("should create a new message", async () => {
      await create(
        "MOCK_TENANT_ID",
        "MOCK_EVENT_ID",
        "MOCK_RECIPIENT_ID",
        "MOCK_MESSAGE_ID"
      );
      expect(dynamo.put).toBeCalledTimes(1);
      expect(dynamo.put).toMatchSnapshot();
    });

    it("should increment the error count on a message", async () => {
      await incrementErrorCount("MOCK_TENANT_ID", "MOCK_EVENT_ID");
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should set the billing units id value on a message", async () => {
      await setBilledUnits("MOCK_TENANT_ID", "MOCK_EVENT_ID", 1.0);
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should set the notification id value on a message", async () => {
      await setNotificationId(
        "MOCK_TENANT_ID",
        "MOCK_EVENT_ID",
        "MOCK_NOTIFICATION_ID"
      );
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should set the email address value on a message", async () => {
      await markEmail("MOCK_TENANT_ID", "MOCK_EVENT_ID", "email@example.com");
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should mark a message as unmapped", async () => {
      await markUnmapped("MOCK_TENANT_ID", "MOCK_MESSAGE_ID");
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    describe("markUnroutable", () => {
      const MOCK_LOG_ITEMS = [
        {
          id: "MOCK_EVENT_LOG_ID_1",
          json: {},
          messageId: "MOCK_MESSAGE_ID",
          type: "event:received",
        },
      ];

      beforeEach(() => {
        (dynamo.query as jest.Mock).mockResolvedValue({
          Items: MOCK_LOG_ITEMS,
        });
      });

      [
        { event: "sent", type: "provider:sent" },
        { event: "delivered", type: "provider:delivered" },
        { event: "opened", type: "event:opened" },
        { event: "clicked", type: "event:click" },
      ].forEach(({ event, type }) => {
        it(`should not mark a message unroutable if "${event}"`, async () => {
          (dynamo.query as jest.Mock).mockResolvedValue({
            Items: [
              ...MOCK_LOG_ITEMS,
              {
                id: "MOCK_EVENT_LOG_ID_2",
                json: { channel: { id: "MOCK_CHANNEL", label: "MOCK_LABEL" } },
                messageId: "MOCK_MESSAGE_ID",
                type,
              },
            ],
          });
          await markUnroutable("MOCK_TENANT_ID", "MOCK_MESSAGE_ID");
          expect(dynamo.update).not.toBeCalled();
        });
      });

      it("should mark a message as unroutable", async () => {
        await markUnroutable("MOCK_TENANT_ID", "MOCK_MESSAGE_ID");
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });
    });

    describe("markUndeliverable", () => {
      const MOCK_LOG_ITEMS = [
        {
          id: "MOCK_EVENT_LOG_ID_1",
          json: {},
          messageId: "MOCK_MESSAGE_ID",
          type: "message:received",
        },
      ];

      beforeEach(() => {
        (dynamo.query as jest.Mock).mockResolvedValue({
          Items: MOCK_LOG_ITEMS,
        });
      });

      [
        { event: "sent", type: "provider:sent" },
        { event: "delivered", type: "provider:delivered" },
        { event: "opened", type: "event:opened" },
        { event: "clicked", type: "event:click" },
      ].forEach(({ event, type }) => {
        it(`should not mark a message undeliverable if "${event}"`, async () => {
          (dynamo.query as jest.Mock).mockResolvedValue({
            Items: [
              ...MOCK_LOG_ITEMS,
              {
                id: "MOCK_EVENT_LOG_ID_2",
                json: { channel: { id: "MOCK_CHANNEL", label: "MOCK_LABEL" } },
                messageId: "MOCK_MESSAGE_ID",
                type,
              },
            ],
          });
          await markUndeliverable("MOCK_TENANT_ID", "MOCK_MESSAGE_ID");
          expect(dynamo.update).not.toBeCalled();
        });
      });

      it("should mark a message as undeliverable", async () => {
        await markUndeliverable("MOCK_TENANT_ID", "MOCK_MESSAGE_ID");
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });

      it("should mark a message as undeliverable with configuration", async () => {
        await markUndeliverable("MOCK_TENANT_ID", "MOCK_MESSAGE_ID", {
          configuration: "MOCK_CONFIGURATION",
        });
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });

      it("should mark a message as undeliverable with provider", async () => {
        await markUndeliverable("MOCK_TENANT_ID", "MOCK_MESSAGE_ID", {
          provider: "MOCK_PROVIDER",
        });
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });

      it("should mark a message as undeliverable with internal courier error", async () => {
        await markUndeliverable("MOCK_TENANT_ID", "MOCK_MESSAGE_ID", {
          errorMessage: "Internal Courier Error",
        });
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });
    });

    describe("markUndeliverableFromDelivery", () => {
      const MOCK_LOG_ITEMS = [
        {
          id: "MOCK_EVENT_LOG_ID_1",
          json: {},
          messageId: "MOCK_MESSAGE_ID",
          type: "message:received",
        },
      ];

      beforeEach(() => {
        (dynamo.query as jest.Mock).mockResolvedValue({
          Items: MOCK_LOG_ITEMS,
        });
      });

      [
        { event: "delivered", type: "provider:delivered" },
        { event: "opened", type: "event:opened" },
        { event: "clicked", type: "event:click" },
      ].forEach(({ event, type }) => {
        it(`should not mark a message undeliverable if "${event}"`, async () => {
          (dynamo.query as jest.Mock).mockResolvedValue({
            Items: [
              ...MOCK_LOG_ITEMS,
              {
                id: "MOCK_EVENT_LOG_ID_2",
                json: { channel: { id: "MOCK_CHANNEL", label: "MOCK_LABEL" } },
                messageId: "MOCK_MESSAGE_ID",
                type,
              },
            ],
          });
          await markUndeliverableFromDelivery(
            "MOCK_TENANT_ID",
            "MOCK_MESSAGE_ID"
          );
          expect(dynamo.update).not.toBeCalled();
        });
      });

      it("should mark a message as undeliverable", async () => {
        await markUndeliverableFromDelivery(
          "MOCK_TENANT_ID",
          "MOCK_MESSAGE_ID"
        );
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });

      it("should mark a message as undeliverable with configuration", async () => {
        await markUndeliverableFromDelivery(
          "MOCK_TENANT_ID",
          "MOCK_MESSAGE_ID",
          {
            configuration: "MOCK_CONFIGURATION",
          }
        );
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });

      it("should mark a message as undeliverable with provider", async () => {
        await markUndeliverableFromDelivery(
          "MOCK_TENANT_ID",
          "MOCK_MESSAGE_ID",
          {
            provider: "MOCK_PROVIDER",
          }
        );
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });

      it("should mark a message as undeliverable with internal courier error", async () => {
        await markUndeliverableFromDelivery(
          "MOCK_TENANT_ID",
          "MOCK_MESSAGE_ID",
          {
            errorMessage: "Internal Courier Error",
          }
        );
        expect(dynamo.update).toBeCalledTimes(1);
        expect(dynamo.update).toMatchSnapshot();
      });
    });

    it("should mark a message as simulated", async () => {
      await markSimulated(
        "MOCK_TENANT_ID",
        "MOCK_MESSAGE_ID",
        "MOCK_PROVIDER",
        "MOCK_CONFIGURATION"
      );
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should mark a message as sent", async () => {
      await markSent(
        "MOCK_TENANT_ID",
        "MOCK_MESSAGE_ID",
        "MOCK_PROVIDER",
        "MOCK_CONFIGURATION"
      );
      // 2: updateSentExtraData and updateSentStatus
      expect(dynamo.update).toBeCalledTimes(2);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should mark a message as delivered", async () => {
      await markDelivered(
        "MOCK_TENANT_ID",
        "MOCK_MESSAGE_ID",
        "MOCK_PROVIDER",
        "MOCK_CONFIGURATION"
      );
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should mark a message as opened", async () => {
      const timestamp = 1632427827545;
      await markOpened("MOCK_TENANT_ID", "MOCK_MESSAGE_ID", timestamp);
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should mark a message as clicked", async () => {
      const timestamp = 1632427827545;
      await markClicked("MOCK_TENANT_ID", "MOCK_MESSAGE_ID", timestamp);
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should mark a message as read", async () => {
      const timestamp = 1632427827545;
      await markRead("MOCK_TENANT_ID", "MOCK_MESSAGE_ID");
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });

    it("should mark a message as unread", async () => {
      const timestamp = 1632427827545;
      await markUnread("MOCK_TENANT_ID", "MOCK_MESSAGE_ID");
      expect(dynamo.update).toBeCalledTimes(1);
      expect(dynamo.update).toMatchSnapshot();
    });
  });

  describe("when seeing if a message should be marked undeliverable", () => {
    it("will return false if history contains CLICKED", () => {
      const history: Array<IRoutedMessageHistory<RoutedMessageHistoryTypes>> = [
        {
          channel: {
            id: "ab17b3cd-21a7-47fb-b1dc-a60ee7f6c2f4",
            label: "",
          },
          integration: {
            id: "4276e969-9c45-42de-9cc1-7175623d4d27",
            provider: "providerWithDelivery",
          },
          ts: 16134123412,
          type: "CLICKED",
        },
      ];

      expect(shouldMarkUndeliverable(history, ["CLICKED"])).toBe(false);
    });

    it("will return false if history contains DELIVERED", () => {
      const history: Array<IRoutedMessageHistory<RoutedMessageHistoryTypes>> = [
        {
          channel: {
            id: "ab17b3cd-21a7-47fb-b1dc-a60ee7f6c2f4",
            label: "",
          },
          integration: {
            id: "4276e969-9c45-42de-9cc1-7175623d4d27",
            provider: "providerWithDelivery",
          },
          ts: 16134123412,
          type: "DELIVERED",
        },
      ];

      expect(shouldMarkUndeliverable(history, ["DELIVERED"])).toBe(false);
    });

    it("will return false if history contains OPENED", () => {
      const history: Array<IRoutedMessageHistory<RoutedMessageHistoryTypes>> = [
        {
          channel: {
            id: "ab17b3cd-21a7-47fb-b1dc-a60ee7f6c2f4",
            label: "",
          },
          integration: {
            id: "4276e969-9c45-42de-9cc1-7175623d4d27",
            provider: "providerWithDelivery",
          },
          ts: 16134123412,
          type: "OPENED",
        },
      ];

      expect(shouldMarkUndeliverable(history, ["OPENED"])).toBe(false);
    });

    it("will return true if history contains no routed events", () => {
      const history: Array<IMessageHistory<MessageHistoryType>> = [
        {
          ts: 1610475430221,
          type: "ENQUEUED",
        },
      ];

      expect(shouldMarkUndeliverable(history, [])).toBe(true);
    });

    it("will not throw an error if history contains undeliverable w/o routing details", () => {
      const history: IUndeliverableMessageHistory[] = [
        {
          reason: "FAILED",
          ts: 1610475430221,
          type: "UNDELIVERABLE",
        },
      ];

      expect(() => shouldMarkUndeliverable(history, [])).not.toThrow();
    });
  });
});
