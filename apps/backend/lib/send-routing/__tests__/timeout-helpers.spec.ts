import { currentTimeMs, currentTimeIso } from "~/lib/utils";
import { makeRouteLeaf } from "../generate-routing";
import {
  getTimedOutLeafs,
  getTimeoutTable,
  isRouteLeafTimedOut,
  setSendTimesForLeafs,
} from "../timeout-helpers";
import { SendTimes, RouteTimeoutTable } from "../types";
import { complexSmsAndEmailTree } from "../__mocks__/trees";

jest.mock("~/lib/utils/date");
const mockNow = currentTimeMs as jest.Mock;
const mockNowIso = currentTimeIso as jest.Mock;
const isoMs = (iso: string) => new Date(iso).getTime();

describe("route tree timeout helpers", () => {
  afterEach(jest.clearAllMocks);
  const times: SendTimes = {
    message: "2022-07-10T10:00:00.000Z",
    channels: {
      sms: "2022-07-10T10:00:00.100Z",
      email: "2022-07-10T11:00:00.000Z",
      push: "2022-07-10T10:00:00.000Z",
    },
  };
  const timeouts: RouteTimeoutTable = {
    message: 10000000,
    channel: 60000,
    provider: 500,
    channels: {
      email: {
        provider: 5000,
        channel: 6000000,
      },
    },
    providers: {
      twilio: 30,
      mailjet: 120,
    },
  };

  describe("get timed out leafs", () => {
    it("returns the timed out leafs", () => {
      // All SMS leafs should timeout
      mockNow.mockReturnValue(isoMs(times.channels.sms) + timeouts.channel + 1);

      expect(
        getTimedOutLeafs({ tree: complexSmsAndEmailTree, times, timeouts }).map(
          (l) => l.address
        )
      ).toEqual([
        [0, 0],
        [0, "failover", 0],
        [0, "failover", "failover", 0],
        [0, "failover", "failover", 1, 0],
        [0, "failover", "failover", 1, "failover", 0],
      ]);
    });
  });

  describe("is route leaf timed out", () => {
    it("tests message timeout", () => {
      const leaf = makeRouteLeaf({
        channel: "push",
        provider: "apn",
        providerConfigurationId: "beep",
        taxonomy: "boop",
        address: [0],
        providerFailoverIndex: 1,
      });

      const channelIsoMs = isoMs(times.channels.push) + 1;
      mockNow.mockReturnValue(channelIsoMs + timeouts.message);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(true);

      mockNow.mockReturnValue(channelIsoMs);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(false);
    });

    it("tests default channel timeout", () => {
      const leaf = makeRouteLeaf({
        channel: "push",
        provider: "apn",
        providerConfigurationId: "beep",
        taxonomy: "boop",
        address: [0],
        providerFailoverIndex: 1,
      });

      const channelIsoMs = isoMs(times.channels.push) + 1;
      mockNow.mockReturnValue(channelIsoMs + timeouts.channel);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(true);

      mockNow.mockReturnValue(channelIsoMs);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(false);
    });

    it("tests configured channel timeout", () => {
      const leaf = makeRouteLeaf({
        channel: "email",
        provider: "mailjet",
        providerConfigurationId: "beep",
        taxonomy: "boop",
        address: [0],
        providerFailoverIndex: 1,
      });

      const channelIsoMs = isoMs(times.channels.email) + 1;
      mockNow.mockReturnValue(channelIsoMs + timeouts.channels.email.channel);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(true);

      mockNow.mockReturnValue(channelIsoMs);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(false);
    });

    it("tests default provider timeout", () => {
      const leaf = makeRouteLeaf({
        channel: "sms",
        provider: "sinch",
        providerConfigurationId: "beep",
        taxonomy: "boop",
        address: [0],
        providerFailoverIndex: 1,
      });

      const channelIsoMs = isoMs(times.channels.sms) + 1;
      mockNow.mockReturnValue(channelIsoMs + timeouts.provider);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(true);

      mockNow.mockReturnValue(channelIsoMs);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(false);
    });

    it("tests provider timeout configured by channel", () => {
      const leaf = makeRouteLeaf({
        channel: "email",
        provider: "sinch",
        providerConfigurationId: "beep",
        taxonomy: "boop",
        address: [0],
        providerFailoverIndex: 1,
      });

      const channelIsoMs = isoMs(times.channels.email) + 1;
      mockNow.mockReturnValue(channelIsoMs + timeouts.channels.email.provider);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(true);

      mockNow.mockReturnValue(channelIsoMs);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(false);
    });

    it("tests provider specific timeout", () => {
      const leaf = makeRouteLeaf({
        channel: "sms",
        provider: "twilio",
        providerConfigurationId: "beep",
        taxonomy: "boop",
        address: [0],
        providerFailoverIndex: 1,
      });

      const channelIsoMs = isoMs(times.channels.sms) + 1;
      mockNow.mockReturnValue(channelIsoMs + timeouts.providers.twilio);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(true);

      mockNow.mockReturnValue(channelIsoMs);
      expect(isRouteLeafTimedOut({ timeouts, times, leaf })).toEqual(false);
    });
  });

  describe("set send times for leafs", () => {
    const leafs = [
      makeRouteLeaf({
        channel: "sms",
        provider: "vonage",
        providerConfigurationId: "",
        taxonomy: "",
        providerFailoverIndex: 1,
        address: [0],
      }),
      makeRouteLeaf({
        channel: "email",
        provider: "sendgrid",
        providerConfigurationId: "",
        taxonomy: "",
        providerFailoverIndex: 1,
        address: [1],
      }),
    ];
    mockNowIso.mockReturnValue(times.message);
    expect(setSendTimesForLeafs(leafs)).toMatchObject({
      message: times.message,
      channels: {
        sms: times.message,
        email: times.message,
      },
    });
  });

  describe("get timeout table", () => {
    it("returns correct defaults for custom tier tenants", () => {
      expect(getTimeoutTable({ plan: "custom" })).toMatchObject({
        message: 259200000,
        channel: 1800000,
        provider: 300000,
        providers: {},
        channels: {},
      });
    });

    it("returns correct defaults for non-custom tier tenants", () => {
      expect(getTimeoutTable({ plan: "good" })).toMatchObject({
        message: 259200000,
      });
    });

    it("it builds a table from a message", () => {
      expect(
        getTimeoutTable({
          plan: "custom",
          timeout: {
            message: 300,
            channel: 400,
            provider: 200,
          },
          channels: {
            sms: {
              timeout: 50,
            },
            email: {
              timeout: {
                provider: 100,
                channel: 20,
              },
            },
          },
          providers: {
            sendgrid: {
              timeout: 18,
            },
          },
        })
      ).toMatchObject({
        message: 300,
        channel: 400,
        provider: 200,
        providers: {
          sendgrid: 18,
        },
        channels: {
          sms: {
            channel: 50,
          },
          email: {
            provider: 100,
            channel: 20,
          },
        },
      });
    });
  });
});
