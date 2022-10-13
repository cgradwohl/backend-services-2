import axios from "axios";
import viber from "~/providers/viber";
import sendHandler from "~/providers/viber/send";

jest.mock("axios");

describe("viber provider", () => {
  describe("handles", () => {
    it("should return true when provided a valid config and profile", () => {
      expect(
        viber.handles({
          config: {
            json: {
              token: "1234",
              name: "Hooli",
            },
          } as any,
          profile: {
            viber: {
              receiver: "PiedPiper",
            },
          },
        })
      ).toEqual(true);
    });

    it("should require a token", () => {
      expect(
        viber.handles({
          config: {
            json: {
              name: "Hooli",
            },
          } as any,
          profile: {
            viber: {
              receiver: "PiedPiper",
            },
          },
        })
      ).toEqual(false);
    });

    it("should require a name", () => {
      expect(
        viber.handles({
          config: {
            json: {
              token: "1234",
            },
          } as any,
          profile: {
            viber: {
              receiver: "PiedPiper",
            },
          },
        })
      ).toEqual(false);
    });

    it("should throw an error when profile.viber is not an object", () => {
      expect(
        viber.handles({
          config: {
            json: {
              token: "1234",
            },
          } as any,
          profile: {},
        })
      ).toEqual(false);
    });

    it("should require profile.viber to have a receiver", () => {
      expect(
        viber.handles({
          config: {
            json: {
              token: "1234",
            },
          } as any,
          profile: {
            viber: {},
          },
        })
      ).toEqual(false);
    });
  });

  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should send when provided valid parameters", async () => {
      (axios as any).mockResolvedValue({});
      const params: any = {
        config: {
          json: {
            token: "1234",
            name: "Hooli",
          },
        },
        profile: {
          viber: {
            receiver: "PiedPiper",
          },
        },
      };
      const template = { plain: "foo" };

      await sendHandler(params, template);
    });
  });
});
