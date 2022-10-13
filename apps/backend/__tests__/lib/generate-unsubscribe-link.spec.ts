import { generateUnsubscribeLink } from "~/lib/generate-tracking-links";

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
      const result = generateUnsubscribeLink(
        "a-tenant-id",
        "n",
        "a-notification-id",
        "a-recipient-id"
      );
      expect(result).toBe(
        "https://mytestapiurl.execute-api.us-east-1.amazonaws.com/dev/unsubscribe/n/a-tenant-id.a-notification-id/a-recipient-id"
      );
    });
  });

  describe("with a tracking domain", () => {
    it("will return an unsubscribe link", () => {
      const result = generateUnsubscribeLink(
        "a-tenant-id",
        "n",
        "a-notification-id",
        "a-recipient-id",
        "foobar.com"
      );
      expect(result).toBe(
        "https://a-tenant-id.foobar.com/unsubscribe/n/a-notification-id/a-recipient-id"
      );
    });

    it("will return an unsubscribe link for test env", () => {
      const result = generateUnsubscribeLink(
        "a-tenant-id/test",
        "n",
        "a-notification-id",
        "a-recipient-id",
        "foobar.com"
      );
      expect(result).toBe(
        "https://a-tenant-id-test.foobar.com/unsubscribe/n/a-notification-id/a-recipient-id"
      );
    });
  });
});
