import { generateUnsubscribeTrackingIdLink } from "~/lib/generate-tracking-links";

describe("when generating an unsubscribe link", () => {
  describe("without a tracking domain", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      process.env = {
        ...OLD_ENV,
        API_URL: "https://mytestapiurl.execute-api.us-east-1.amazonaws.com/dev",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
      process.env = OLD_ENV;
    });

    it("will return an unsubscribe link", () => {
      const result = generateUnsubscribeTrackingIdLink(
        "a-tenant-id",
        "a-tracking-id"
      );
      expect(result).toBe(
        "https://mytestapiurl.execute-api.us-east-1.amazonaws.com/dev/u/a-tenant-id.a-tracking-id"
      );
    });
  });

  describe("with a tracking domain", () => {
    it("will return an unsubscribe link", () => {
      const result = generateUnsubscribeTrackingIdLink(
        "a-tenant-id",
        "a-tracking-id",
        "foobar.com"
      );
      expect(result).toBe("https://a-tenant-id.foobar.com/u/a-tracking-id");
    });

    it("will return an unsubscribe link for test env", () => {
      const result = generateUnsubscribeTrackingIdLink(
        "a-tenant-id/test",
        "a-tracking-id",
        "foobar.com"
      );
      expect(result).toBe(
        "https://a-tenant-id-test.foobar.com/u/a-tracking-id"
      );
    });
  });
});
