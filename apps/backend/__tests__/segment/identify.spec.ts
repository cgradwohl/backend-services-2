import uuid from "uuid";
import { identifyInbound } from "~/segment/identify";
import { API_GATEWAY_PROXY_EVENT as API_GATEWAY_PROXY_EVENT_DEFAULT } from "../lib/lambda-response.spec";

jest.mock("~/api/profiles/post");
jest.mock("~/api/send");

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/event-maps", () => ({
  get: jest.fn().mockResolvedValue({
    notifications: [{ id: "notification-id-1" }],
  }),
}));

const SEGMENT_EVENT = {
  anonymousId: uuid.v4(),
  event: "imma test event",
  messageId: uuid.v4(),
  receivedAt: Date.now().toString(),
  timestamp: Date.now().toString(),
  traits: {
    immatrait: "immavalue",
  },
  type: "identify",
  userId: uuid.v4(),
};

const API_GATEWAY_PROXY_EVENT = {
  ...API_GATEWAY_PROXY_EVENT_DEFAULT,
};

describe("when segment identify events are posted", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not throw with expected body with identity as userId", async () => {
    const event = Object.assign({}, SEGMENT_EVENT);
    delete event.anonymousId;

    await expect(
      identifyInbound({
        event: { ...API_GATEWAY_PROXY_EVENT, body: event },
      })
    ).resolves.toEqual(undefined);
  });

  it("should not throw with expected body with identity as anonymousId", async () => {
    const event = Object.assign({}, SEGMENT_EVENT);
    delete event.userId;

    await expect(
      identifyInbound({
        event: { ...API_GATEWAY_PROXY_EVENT, body: event },
      })
    ).resolves.toEqual(undefined);
  });
});
