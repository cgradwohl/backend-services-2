import { MessageBrand, MessageChannels } from "~/api/send/types";
import {
  getBrand,
  getChannelBrandIds,
  getChannelBrands,
  getMessageBrands,
  messageBrandToIBrandContext,
  messageBrandV2ToIBrandContext,
} from "../get-brand";
import getBrandLegacy from "~/workers/lib/get-brand";
import getDefaultBrand from "~/workers/lib/get-default-brand";

const mockGetBrandLegacy = getBrandLegacy as jest.Mock;
const mockGetDefaultBrand = getDefaultBrand as jest.Mock;

jest.mock("~/workers/lib/get-brand");
jest.mock("~/workers/lib/get-default-brand");
jest.mock("~/workers/lib/get-latest-brand");
jest.mock("~/workers/lib/get-latest-default-brand");

describe("Get brand utils", () => {
  beforeEach(jest.resetAllMocks);

  describe("getBrand", () => {
    it("should call get default brand", async () => {
      const tenantId = "tenantId";

      await getBrand({ tenantId, scope: "published/production" });

      expect(mockGetDefaultBrand).toHaveBeenCalledWith(tenantId);
    });

    it("should call get brand legacy", async () => {
      const tenantId = "tenantId";
      const brandId = "brandId";

      await getBrand({ tenantId, scope: "published/production", brandId });

      expect(mockGetBrandLegacy).toHaveBeenCalledWith(tenantId, brandId, {
        extendDefaultBrand: true,
      });
    });
  });

  describe("getChannelBrandIds", () => {
    it("should return array of [channelName, brandId][]", () => {
      const channels: MessageChannels = {
        email: {
          brand_id: "brandId",
        },
        sms: {
          brand_id: "brandIdSms",
        },
      };

      const result = getChannelBrandIds(channels);
      expect(result).toEqual([
        ["email", "brandId"],
        ["sms", "brandIdSms"],
      ]);
    });
  });

  describe("getChannelBrands", () => {
    it("Should return a key value pair of channels and their IBrandContext", async () => {
      const channels: MessageChannels = {
        email: {
          brand_id: "brandId",
        },
        sms: {
          brand_id: "brandIdSms",
        },
      };
      mockGetBrandLegacy.mockResolvedValue({});

      await expect(
        getChannelBrands({
          channels,
          tenantId: "tenantId",
          scope: "published/production",
        })
      ).resolves.toEqual({
        email: {
          partials: {},
        },
        sms: {
          partials: {},
        },
      });
    });
  });

  describe("messageBrandV2ToIBrandContext", () => {
    it("should transform message brand to IBrandContext", () => {
      const inline: MessageBrand = {
        version: "2022-05-17",
        colors: {
          primary: "#ff0000",
          secondary: "#ff0000",
        },
        logo: {
          image: "https://example.com/logo.png",
          href: "https://example.com",
        },
        locales: {
          "eu-fr": {
            colors: {
              primary: "#eee",
              secondary: "#eee",
            },
            logo: {
              image: "https://fr.example.com/logo.png",
              href: "https://fr.example.com",
            },
          },
        },
      };
      const result = messageBrandV2ToIBrandContext(inline);
      delete result.created;
      delete result.updated;
      delete result.locales["eu-fr"].created;
      delete result.locales["eu-fr"].updated;
      expect(result).toMatchSnapshot();
    });
  });

  describe("messageBrandToIBrandContext", () => {
    it("should transform message brand to IBrandContext", () => {
      const inline: MessageBrand = {
        settings: {
          colors: {
            primary: "#ff0000",
            secondary: "#ff0000",
          },
          email: {
            header: {
              logo: {
                image: "https://example.com/logo.png",
                href: "https://example.com",
              },
            },
          },
        },
      };
      const result = messageBrandToIBrandContext(inline);
      delete result.created;
      delete result.updated;
      expect(result).toMatchSnapshot();
    });
  });

  describe("getMessageBrands", () => {
    it("should get the brands", async () => {
      expect.assertions(1);
      const channels: MessageChannels = {
        email: {
          brand_id: "brandId",
        },
        sms: {
          brand_id: "brandIdSms",
        },
      };
      mockGetBrandLegacy.mockResolvedValue({});

      await expect(
        getMessageBrands({
          channels,
          tenantId: "tenantId",
          scope: "published/production",
        })
      ).resolves.toEqual({
        main: undefined,
        channels: {
          email: {
            partials: {},
          },
          sms: {
            partials: {},
          },
        },
      });
    });
  });
});
