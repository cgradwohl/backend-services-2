import getUrlParameters from "~/lib/get-url-params";

describe("getUrlParams", () => {
  describe("with click-through tracking domain", () => {
    const origProcessEnv = process.env;

    beforeEach(() => {
      process.env = {
        ...process.env,
        CLICK_THROUGH_TRACKING_DOMAIN_NAME: "ct0.app",
      };
    });

    afterEach(() => {
      process.env = origProcessEnv;
    });

    it("should return the tenantId and slug values", () => {
      expect(
        getUrlParameters(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.ct0.app",
          "my-slug-value"
        )
      ).toEqual({
        slug: "my-slug-value",
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      });
    });

    it("should handle dev tracking domains", () => {
      process.env = {
        ...process.env,
        CLICK_THROUGH_TRACKING_DOMAIN_NAME: "josh-dev-courier.com",
      };

      expect(
        getUrlParameters(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.josh-dev-courier.com",
          "my-slug-value"
        )
      ).toEqual({
        slug: "my-slug-value",
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      });
    });

    it("should handle no subdomain without throwing", () => {
      expect(getUrlParameters("ct0.app", "my-slug-value")).toEqual({
        slug: "my-slug-value",
        tenantId: undefined,
      });
    });

    it("should handle test env in production", () => {
      expect(
        getUrlParameters(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-test.ct0.app",
          "my-slug-value"
        )
      ).toEqual({
        slug: "my-slug-value",
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/test",
      });
    });

    it("should handle test env dev tracking domains", () => {
      process.env = {
        ...process.env,
        CLICK_THROUGH_TRACKING_DOMAIN_NAME: "josh-dev-courier.com",
      };

      expect(
        getUrlParameters(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-test.josh-dev-courier.com",
          "my-slug-value"
        )
      ).toEqual({
        slug: "my-slug-value",
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/test",
      });
    });
  });

  describe("without click-through tracking domain (dev env)", () => {
    const origProcessEnv = process.env;

    beforeEach(() => {
      process.env = {
        ...process.env,
        CLICK_THROUGH_TRACKING_DOMAIN_NAME: undefined,
      };
    });

    afterEach(() => {
      process.env = origProcessEnv;
    });

    it("should return the tenantId and slug values", () => {
      expect(
        getUrlParameters(
          "ct0.app",
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.my-slug-value"
        )
      ).toEqual({
        slug: "my-slug-value",
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      });
    });

    it("should return the test env tenantId and slug values", () => {
      expect(
        getUrlParameters(
          "ct0.app",
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-test.my-slug-value"
        )
      ).toEqual({
        slug: "my-slug-value",
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/test",
      });
    });

    it("should handle no tenantId without throwing", () => {
      expect(getUrlParameters("ct0.app", "my-slug-value")).toEqual({
        slug: "my-slug-value",
        tenantId: undefined,
      });
    });
  });

  describe("with custom tracking domain", () => {
    const origProcessEnv = process.env;

    beforeEach(() => {
      process.env = {
        ...process.env,
        CLICK_THROUGH_TRACKING_DOMAIN_NAME: "ct0.app",
      };
    });

    afterEach(() => {
      process.env = origProcessEnv;
    });

    it("should return the tenantId and slug values", () => {
      expect(
        getUrlParameters(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.my-website.com",
          "my-slug-value"
        )
      ).toEqual({
        slug: "my-slug-value",
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      });
    });

    it("should return the test tenantId and slug values", () => {
      expect(
        getUrlParameters(
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa-test.my-website.com",
          "my-slug-value"
        )
      ).toEqual({
        slug: "my-slug-value",
        tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/test",
      });
    });
  });
});
