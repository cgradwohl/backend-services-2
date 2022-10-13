import * as trackingService from "~/lib/tracking-service";
import { saveClickThroughTrackingRecords } from "~/lib/tracking-service/save-click-through-tracking";
import fixtures from "./__fixtures__/";
const mockTrackingService = trackingService as any;
jest.mock("~/lib/generate-tracking-links", () => ({
  generateEventTrackingLink: () =>
    `https://example.com/e/${fixture.trackingId}`,
}));
jest.mock("~/lib/tracking-service", () => ({
  saveTrackingRecords: jest.fn(),
}));
jest.mock("~/lib/tracking-service/generate-tracking-id", () => ({
  generateTrackingId: () => fixture.trackingId,
}));
jest.mock("~/lib/tracking-domains", () => ({
  getTrackingDomain: () => "https://example.com",
}));
const fixture = fixtures.json.pushProvider;
describe("Route Click Through Tracking", () => {
  // tslint:disable-next-line: one-variable-per-declaration
  let channel,
    message,
    notification,
    pickedConfig,
    recipientId,
    clickThroughTrackingEnabled,
    links,
    variableData,
    emailOpenTrackingEnabled,
    openTrackingId,
    unsubscribeTrackingId;
  beforeAll(() => {
    ({
      channel,
      clickThroughTrackingEnabled,
      emailOpenTrackingEnabled,
      links,
      message,
      notification,
      openTrackingId,
      unsubscribeTrackingId,
      providerConfig: pickedConfig,
      recipientId,
      variableData,
    } = fixture);
  });
  it("should create a read event", async () => {
    const { trackingUrls } = await saveClickThroughTrackingRecords({
      channel,
      clickThroughTrackingEnabled,
      emailOpenTrackingEnabled,
      links,
      message,
      notification,
      openTrackingId,
      unsubscribeTrackingId,
      providerConfig: pickedConfig,
      recipientId,
      variableData,
    });
    expect(trackingUrls).toMatchObject({
      channelTrackingUrl: `https://example.com/e/${fixture.trackingId}`,
      clickTrackingUrl: `https://example.com/e/${fixture.trackingId}`,
      deliverTrackingUrl: `https://example.com/e/${fixture.trackingId}`,
      readTrackingUrl: `https://example.com/e/${fixture.trackingId}`,
    });
    expect(mockTrackingService.saveTrackingRecords.mock.calls.length).toBe(1);
  });
});
