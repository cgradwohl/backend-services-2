import {
  getChannelKey,
  getEvent,
  getGroupKey,
  getProviders,
  getProviderStatus,
  getSentTimestamp,
  IFoundEvents,
  IGetEventArg,
} from "~/lib/message-service/pattern-matching";
import { IMessageLog, MessageStatus } from "~/lib/message-service/types";
import { IEventLogEntry } from "~/types.api";

jest.mock("~/lib/dynamo/event-logs", () => {
  return {
    getLogs: jest.fn(),
  };
});

jest.mock("~/lib/dynamo/messages", () => {
  return {
    get: jest.fn(),
  };
});

const castPartialToFull = (arg: Partial<IEventLogEntry>) =>
  arg as IEventLogEntry;

describe("when getting channel key", () => {
  const PROVIDER = Object.freeze({
    channel: "a-channel",
    class: "a-class",
    provider: "a-provider",
  });

  const testSuite: Array<[{ hasClass: boolean; hasStar: boolean }, string]> = [
    [{ hasClass: false, hasStar: true }, PROVIDER.channel],
    [{ hasClass: true, hasStar: true }, PROVIDER.class],
    [{ hasClass: false, hasStar: false }, PROVIDER.provider],
    [{ hasClass: true, hasStar: false }, PROVIDER.provider],
  ];

  for (const [testCase, expected] of testSuite) {
    it(`will return ${expected} if pattern matches`, () =>
      expect(getChannelKey(testCase, PROVIDER)).toBe(expected));
  }
});

describe("when getting event", () => {
  const eventNotification: Partial<IEventLogEntry> = {
    json: { eventId: "an-event-id-1" },
  };
  const eventUnmapped: Partial<IEventLogEntry> = {
    json: { eventId: "an-event-id-2" },
  };
  const eventReceived: Partial<IEventLogEntry> = {
    json: { body: { event: "an-event-id-3" } },
  };

  const testSuite: Array<[IGetEventArg, string]> = [
    [
      {
        eventNotification: castPartialToFull(eventNotification),
        eventReceived: castPartialToFull(eventReceived),
        eventUnmapped: castPartialToFull(eventUnmapped),
      },
      "an-event-id-1",
    ],
    [
      {
        eventNotification: undefined,
        eventReceived: castPartialToFull(eventReceived),
        eventUnmapped: castPartialToFull(eventUnmapped),
      },
      "an-event-id-2",
    ],
    [
      {
        eventNotification: undefined,
        eventReceived: castPartialToFull(eventReceived),
        eventUnmapped: undefined,
      },
      "an-event-id-3",
    ],
    [
      {
        eventNotification: undefined,
        eventReceived: undefined,
        eventUnmapped: undefined,
      },
      undefined,
    ],
  ];

  for (const [testCase, expected] of testSuite) {
    it(`will return ${expected} if pattern matches`, () =>
      expect(getEvent(testCase)).toBe(expected));
  }
});

describe("when getting group key", () => {
  const testSuite: Array<[string, { id: string }, string, string]> = [
    ["a-provider", { id: "a-channel-id" }, undefined, "a-channel-id"],
    ["a-provider", { id: "a-channel-id" }, "b-channel-id", "a-channel-id"],
    ["a-provider", undefined, "b-channel-id", "b-channel-id"],
    ["a-provider", undefined, undefined, "a-provider"],
  ];

  for (const [provider, channel, channelId, expected] of testSuite) {
    it(`will return ${expected} if pattern matches`, () =>
      expect(getGroupKey(provider, channel, channelId)).toBe(expected));
  }
});

describe("when getting providers", () => {
  const fn = jest.fn();
  const MESSAGE_LOG_PROVIDERS: IMessageLog["providers"] = [
    {
      channel: { key: "a-channel-id", template: "a-template" },
      provider: "a-provider",
      status: "ENQUEUED",
    },
  ];

  beforeEach(() => {
    fn.mockReturnValue(MESSAGE_LOG_PROVIDERS);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const testSuite: Array<
    [
      { includeProviders: boolean; statusWithProviders: boolean },
      IMessageLog["providers"]
    ]
  > = [
    [
      { includeProviders: true, statusWithProviders: true },
      MESSAGE_LOG_PROVIDERS,
    ],
    [{ includeProviders: true, statusWithProviders: false }, []],
    [{ includeProviders: false, statusWithProviders: true }, undefined],
    [{ includeProviders: false, statusWithProviders: false }, undefined],
  ];

  for (const [testCase, expected] of testSuite) {
    it(`will return ${expected} if pattern matches`, () =>
      expect(getProviders(testCase, fn)).toStrictEqual(expected));
  }
});

describe("when getting provider status", () => {
  const testSuite: Array<[IFoundEvents, MessageStatus]> = [
    [
      {
        clicked: true,
        delivered: true,
        opened: true,
        sent: true,
        undeliverable: true,
      },
      "CLICKED",
    ],
    [
      {
        clicked: false,
        delivered: true,
        opened: true,
        sent: true,
        undeliverable: true,
      },
      "OPENED",
    ],
    [
      {
        clicked: false,
        delivered: true,
        opened: false,
        sent: true,
        undeliverable: true,
      },
      "DELIVERED",
    ],
    [
      {
        clicked: false,
        delivered: true,
        opened: false,
        sent: false,
        undeliverable: true,
      },
      "DELIVERED",
    ],
    [
      {
        clicked: false,
        delivered: false,
        opened: false,
        sent: true,
        undeliverable: true,
      },
      "UNDELIVERABLE",
    ],
    [
      {
        clicked: false,
        delivered: false,
        opened: false,
        sent: true,
        undeliverable: false,
      },
      "SENT",
    ],
    [
      {
        clicked: false,
        delivered: false,
        opened: false,
        sent: false,
        undeliverable: true,
      },
      "UNDELIVERABLE",
    ],
  ];

  for (const [testCase, expected] of testSuite) {
    it(`will return ${expected} if pattern matches`, () =>
      expect(getProviderStatus(testCase)).toBe(expected));
  }
});

describe("when getting sent timestamp", () => {
  const testSuite: Array<
    [{ delivered: number; providerSent: Partial<IEventLogEntry> }, number]
  > = [
    [{ delivered: undefined, providerSent: { timestamp: 42 } }, 42],
    [{ delivered: 47, providerSent: { timestamp: 42 } }, 42],
    [{ delivered: 47, providerSent: undefined }, 47],
    [{ delivered: undefined, providerSent: undefined }, undefined],
  ];

  for (const [testCase, expected] of testSuite) {
    it(`will return ${expected} if pattern matches`, () =>
      expect(getSentTimestamp(castTestCase(testCase))).toBe(expected));
  }
});

const castTestCase = (testCase: {
  delivered: number;
  providerSent: Partial<IEventLogEntry>;
}) => ({
  ...testCase,
  providerSent: castPartialToFull(testCase.providerSent),
});
