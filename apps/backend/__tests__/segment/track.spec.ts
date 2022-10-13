import uuid from "uuid";
import { handleSendRequest } from "~/api/send";
import { trackInbound } from "~/segment/track";
import { get as getEventMap } from "~/lib/event-maps";
import { API_GATEWAY_PROXY_EVENT as API_GATEWAY_PROXY_EVENT_DEFAULT } from "../lib/lambda-response.spec";

jest.mock("~/api/send");

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/event-maps", () => ({
  get: jest.fn().mockResolvedValue({
    notifications: [{ id: "notification-id-1" }],
  }),
}));

jest.mock("~/lib/get-environment-variable");

const SEGMENT_EVENT = {
  anonymousId: uuid.v4(),
  event: "imma test event",
  messageId: uuid.v4(),
  properties: {
    immaproperty: "immavalue",
  },
  receivedAt: Date.now().toString(),
  timestamp: Date.now().toString(),
  type: "track",
  userId: uuid.v4(),
};

const API_GATEWAY_PROXY_EVENT = {
  ...API_GATEWAY_PROXY_EVENT_DEFAULT,
};

describe("when segment track events are posted", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not throw but not enqueue an event if a mapping does not exist", async () => {
    (getEventMap as jest.Mock).mockResolvedValueOnce(undefined);

    const event = Object.assign({}, SEGMENT_EVENT);
    delete event.anonymousId;

    await expect(
      trackInbound({ event: { ...API_GATEWAY_PROXY_EVENT, body: event } })
    ).resolves.toEqual(undefined);
    expect(handleSendRequest as jest.Mock).toBeCalledTimes(0);
  });

  it("should not throw with expected body with identity as userId", async () => {
    const event = Object.assign({}, SEGMENT_EVENT);
    delete event.anonymousId;

    await expect(
      trackInbound({ event: { ...API_GATEWAY_PROXY_EVENT, body: event } })
    ).resolves.toEqual(undefined);
    expect(handleSendRequest as jest.Mock).toBeCalledTimes(1);
  });

  it("should not throw with expected body with identity as anonymousId", async () => {
    const event = Object.assign({}, SEGMENT_EVENT);
    delete event.userId;

    await expect(
      trackInbound({ event: { ...API_GATEWAY_PROXY_EVENT, body: event } })
    ).resolves.toEqual(undefined);
    expect(handleSendRequest as jest.Mock).toBeCalledTimes(1);
  });
});
