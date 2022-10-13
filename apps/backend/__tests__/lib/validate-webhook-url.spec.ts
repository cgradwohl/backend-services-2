import { validateUrl } from "../../lib/validate-webhook-url";

describe("validateWebhookUrl", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should reject local servers", () => {
    expect(validateUrl("https://localhost/foo.html")).toBeFalsy();
  });

  it("should reject invalid port", () => {
    expect(validateUrl("https://www.example.com:3000/foo.html")).toBeFalsy();
  });

  it("should reject invalid protocol", () => {
    expect(validateUrl("ftp://www.example.com/foo.html")).toBeFalsy();
  });
});
