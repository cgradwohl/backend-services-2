process.env.COURIER_EMAIL_CONFIG_ID = "MOCK_COURIER_EMAIL_CONFIG_ID";
process.env.COURIER_TENANT_ID = "MOCK_COURIER_TENANT_ID";
import uuid from "uuid";
import renderPreviewEmail from "~/lib/notifications/render-preview-email";
import fixtures from "../triggers/test-notification/__fixtures__";
const mockConfigurationId = uuid.v4();
const { selectedChannel, notificationMessage, notification } = fixtures.success;
const mockConfiguration = {
  id: mockConfigurationId,
  json: {
    provider: "sendgrid",
  },
};
jest.mock("~/lib/tenant-service", () => ({
  get: () => [
    {
      email: "test@example.com",
      id: "123",
      verified: true,
    },
  ],
}));
jest.mock("~/lib/configurations-service", () => ({
  get: () => mockConfiguration,
}));
jest.mock("~/lib/notification-service", () => ({
  get: () => notification,
}));
jest.mock("~/lib/notification-service/draft", () => ({
  get: jest.fn(),
}));

jest.mock("isomorphic-dompurify", () => {
  return {
    sanitize: (input: string, options: any) => input,
  };
});

describe("Studio Email Preview", () => {
  beforeAll(() => {
    notificationMessage.eventData.from = "FROM_VARIABLE";
    notificationMessage.eventData.bcc = "BCC_VARIABLE";
    notificationMessage.eventData.cc = "CC_VARIABLE";
    notificationMessage.eventData.replyTo = "REPLY_TO_VARIABLE";
    selectedChannel.config.email.emailFrom = "{from}@example.com";
    selectedChannel.config.email.emailBCC = "{bcc}@example.com";
    selectedChannel.config.email.emailCC = "{cc}@example.com";
    selectedChannel.config.email.emailReplyTo = "{replyTo}@example.com";
  });
  it("should create an email preview", async () => {
    const result = await renderPreviewEmail(notificationMessage);
    const expectedFromEmail = `${notificationMessage.eventData.from}@example.com`;
    const expectedBCC = `${notificationMessage.eventData.bcc}@example.com`;
    const expectedCC = `${notificationMessage.eventData.cc}@example.com`;
    const expectedReply = `${notificationMessage.eventData.replyTo}@example.com`;
    const templates = result.templates;
    expect(templates.from).toBe(expectedFromEmail);
    expect(templates.bcc).toBe(expectedBCC);
    expect(templates.cc).toBe(expectedCC);
    expect(templates.replyTo).toBe(expectedReply);
  });
});
