import { ILinkData, ILinkOptions } from "~/lib/link-handler";
import { getLinkTrackingCallback } from "~/lib/tracking-service/get-link-tracking-callback";

jest.mock("~/lib/tracking-domains", () => ({
  getTrackingDomain: jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce("dev-courier.com")
    .mockResolvedValueOnce("dev-courier.com"),
}));
jest.mock("~/lib/get-environment-variable");

const options: ILinkOptions = { href: "https://courier.com" };
const link: ILinkData = {
  context: "$.link_one",
  options,
};
const links = {
  link_one: link,
};

describe("when getting link tracking callback without a CTT Domain Name", () => {
  beforeEach(() => {
    process.env = {
      ...process.env,
      API_URL: "https://tracking-server.io",
    };
  });

  it("will handle prod tenant ids", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const fn = await getLinkTrackingCallback(links, tenantId);

    expect(fn("link_one").trackingHref).toMatch(
      /^https:\/\/tracking-server.io\/r\/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\./
    );
  });

  it("will handle test tenant ids", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/test";
    const fn = await getLinkTrackingCallback(links, tenantId);

    expect(fn("link_one").trackingHref).toMatch(
      /^https:\/\/tracking-server.io\/r\/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-test\./
    );
  });
});

describe("when getting link tracking callback without a CTT Domain Name", async () => {
  beforeEach(() => {
    process.env = {
      ...process.env,
      API_URL: "https://tracking-server.io",
      CLICK_THROUGH_TRACKING_DOMAIN_NAME: "dev-courier.com",
    };
  });

  it("will handle prod tenant ids", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const fn = await getLinkTrackingCallback(links, tenantId);

    expect(fn("link_one").trackingHref).toMatch(
      /^https:\/\/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.dev-courier.com\/r\//
    );
  });

  it("will handle test tenant ids", async () => {
    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/test";
    const fn = await getLinkTrackingCallback(links, tenantId);

    expect(fn("link_one").trackingHref).toMatch(
      /^https:\/\/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-test.dev-courier.com\/r\//
    );
  });
});
