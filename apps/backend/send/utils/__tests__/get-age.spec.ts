import { TimeoutDateEpochSeconds } from "~/api/send/types";
import { getMaxAge, getReadableAge, isTimedout } from "../get-age";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");

describe("timeout utils", () => {
  const globalDate = Date;

  beforeEach(() => {
    (global.Date.now as any) = jest.fn(() => 3000000);
  });

  afterEach(jest.clearAllMocks);

  afterAll(() => {
    global.Date = globalDate;
  });

  const baseEpochTimeout: TimeoutDateEpochSeconds = {
    message: 123456,
    channel: 123456,
    provider: 123486,
    channels: {
      email: {
        channel: 123456,
        provider: 123456,
      },
    },
    providers: {
      apn: 123486,
    },
  };

  describe("get max age", () => {
    it("should convert timeout to epoch seconds date", () => {
      expect(
        getMaxAge({
          timeout: {
            channel: 3000,
            provider: 3000,
            message: 20,
          },
          channels: {
            email: { timeout: 3000 },
            push: { timeout: { channel: 123, provider: 5 } },
          },
          providers: {
            apn: { timeout: 4567 },
          },
          plan: "custom",
        })
      ).toMatchInlineSnapshot(`
        Object {
          "channel": 3003,
          "channels": Object {
            "email": Object {
              "channel": 3003,
            },
            "push": Object {
              "channel": 3000,
              "provider": 3000,
            },
          },
          "message": 3000,
          "provider": 3003,
          "providers": Object {
            "apn": 3004,
          },
        }
      `);
    });

    it("generates correct defaults", () => {
      expect(getMaxAge({ plan: "custom" })).toMatchInlineSnapshot(`
        Object {
          "channel": 4800,
          "channels": Object {},
          "message": 262200,
          "provider": 3300,
          "providers": Object {},
        }
      `);
    });
  });

  describe("get readable age", () => {
    it("should convert timeout epoch seconds to a human readable date", () => {
      expect(getReadableAge({ timeout: baseEpochTimeout }))
        .toMatchInlineSnapshot(`
        Object {
          "channel": "1970-01-02T10:17:36.000Z",
          "channels": Object {
            "email": Object {
              "channel": "1970-01-02T10:17:36.000Z",
              "provider": "1970-01-02T10:17:36.000Z",
            },
          },
          "message": "1970-01-02T10:17:36.000Z",
          "provider": "1970-01-02T10:18:06.000Z",
          "providers": Object {
            "apn": "1970-01-02T10:18:06.000Z",
          },
        }
      `);
    });
  });

  describe("isTimedout", () => {
    it("should correctly mark notification as timed out", () => {
      (Date.now as jest.Mock).mockReturnValue(4000000000);
      expect(
        isTimedout({
          channel: "email",
          maxAge: baseEpochTimeout,
          provider: "apn",
        })
      ).toStrictEqual(true);
    });

    it("should correctly mark notification as not timed out", () => {
      (Date.now as jest.Mock).mockReturnValue(40);
      expect(
        isTimedout({
          channel: "email",
          maxAge: baseEpochTimeout,
          provider: "apn",
        })
      ).toStrictEqual(false);
    });

    // TODO: Expand tests to cover order of precedence
  });
});
