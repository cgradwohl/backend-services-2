import * as eventLogFns from "~/lib/dynamo/event-logs";
import { IRouteAction } from "~/send/types";
import { route } from "~/send/worker/commands/route";

jest.mock("~/workers/route/channel-handles", () => ({
  channelHandles: jest
    .fn()
    .mockResolvedValueOnce({
      channel: {
        id: "f1bfb93f-a0a2-44ca-b8ec-67971f5e9d20",
        taxonomy: "email:*",
        disabled: false,
      },
      channelProvider: {
        configurationId: "62736569-abbb-41d5-a8f9-c573830c10cb",
        key: "postmark",
      },
      channelsSummary: [
        {
          channel: "email",
          provider: "postmark",
          selected: true,
        },
      ],
    })
    .mockResolvedValueOnce({
      channelsSummary: [
        {
          channel: "email",
          provider: "postmark",
          selected: false,
        },
      ],
    }),
}));

jest.mock("~/send/service", () => {
  const mockContext = {
    content: {
      json: {
        channels: {
          always: [],
          bestOf: [
            {
              id: "f1bfb93f-a0a2-44ca-b8ec-67971f5e9d20",
              taxonomy: "email:*",
              providers: [
                {
                  configurationId: "62736569-abbb-41d5-a8f9-c573830c10cb",
                  key: "postmark",
                },
              ],
              disabled: false,
            },
          ],
        },
      },
      objtype: "event",
      id: "notification-template-id",
    },
    providers: [
      {
        objtype: "configuration",
        id: "62736569-abbb-41d5-a8f9-c573830c10cb",
      },
    ],
    scope: "published/production",
    tenant: {
      stripeSubscriptionItemPriceId: "custom",
    },
  };

  return {
    renderService: jest.fn().mockReturnValue({
      // value of {} just to mimick Promise<void>
      emit: jest.fn().mockResolvedValueOnce({}),
    }),
    contextService: jest.fn().mockReturnValue({
      get: jest
        .fn()
        .mockResolvedValueOnce(mockContext)
        .mockResolvedValueOnce({
          ...mockContext,
          preferences: {
            notifications: {
              "notification-template-id": {
                status: "OPTED_OUT",
              },
            },
          },
        })
        .mockResolvedValueOnce({
          ...mockContext,
          variableData: {
            maxAge: {
              message: 16839394,
              channel: 5000,
              channels: { email: { channel: 16839392 } },
              provider: 16894940,
              providers: { sendgrid: 16894940 },
            },
          },
        }),
    }),
  };
});

jest.mock("~/lib/dynamo/event-logs", () => ({
  createRoutedEvent: jest.fn(),
  createUndeliverableEvent: jest.fn(),
  createErrorEvent: jest.fn(() => {
    throw new Error("We had an error");
  }),
  createTimedoutEvent: jest.fn(),
}));

const createRoutedEventSpy = jest.spyOn(eventLogFns, "createRoutedEvent");
const createUndeliverableEventSpy = jest.spyOn(
  eventLogFns,
  "createUndeliverableEvent"
);
const createTimedoutEventSpy = jest.spyOn(eventLogFns, "createTimedoutEvent");

describe("[Router] event logs and action emitting", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should perform routing and emit render action", async () => {
    // expect this to not throw
    const routeAction: IRouteAction = {
      command: "route",
      dryRunKey: undefined,
      requestId: "1-618f5782-3c12de043027b9246138098e",
      tenantId: "56f10a9f-4d79-458f-83e1-6d14a8822299",
      messageId: "1-618f5782-3c12de043027b9246138098e",
      messageFilePath: "filepath.json",
      contextFilePath: "filepath.json",
    };
    await route(routeAction);
    expect(createRoutedEventSpy).toHaveBeenCalledTimes(1);
    expect(createUndeliverableEventSpy).toHaveBeenCalledTimes(0);
  });

  it("should perform fire off `undeliverable` if user has `OPTED_OUT` from receiving notification", async () => {
    const routeAction: IRouteAction = {
      command: "route",
      dryRunKey: undefined,
      requestId: "1-618f5782-3c12de043027b9246138098e",
      tenantId: "56f10a9f-4d79-458f-83e1-6d14a8822299",
      messageId: "1-618f5782-3c12de043027b9246138098e",
      messageFilePath: "filepath.json",
      contextFilePath: "filepath.json",
    };
    await route(routeAction);
    expect(createRoutedEventSpy).toHaveBeenCalledTimes(0);
    expect(createUndeliverableEventSpy).toHaveBeenCalledTimes(1);
  });

  it("should perform fire off `timedout` if channel/provider has expired", async () => {
    const routeAction: IRouteAction = {
      command: "route",
      dryRunKey: undefined,
      requestId: "1-618f5782-3c12de043027b9246138098e",
      tenantId: "56f10a9f-4d79-458f-83e1-6d14a8822299",
      messageId: "1-618f5782-3c12de043027b9246138098e",
      messageFilePath: "filepath.json",
      contextFilePath: "filepath.json",
      retryCount: 1,
    };
    await route(routeAction);
    expect(createRoutedEventSpy).toHaveBeenCalledTimes(0);
    expect(createUndeliverableEventSpy).toHaveBeenCalledTimes(0);
    expect(createTimedoutEventSpy).toHaveBeenCalledTimes(2);
  });
});
