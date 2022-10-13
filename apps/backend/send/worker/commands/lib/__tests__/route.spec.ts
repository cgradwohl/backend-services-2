import { assertIsValidRoutingChannel } from "../route";

describe("assertIsValidRoutingChannel", () => {
  it("should throw given an invalid routing channel", () => {
    expect(() => assertIsValidRoutingChannel({})).toThrow();
  });

  it("should throw if RoutingChannelStrategy is missing channel", () => {
    expect(() =>
      assertIsValidRoutingChannel({
        providers: [],
        method: "all",
      })
    ).toThrow();
  });

  it("should not throw given a valid routing channel", () => {
    expect(() => assertIsValidRoutingChannel("sms")).not.toThrow();
    expect(() =>
      assertIsValidRoutingChannel({
        method: "all",
        channels: [],
      })
    ).not.toThrow();
  });
});
