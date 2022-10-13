process.env.COURIER_EMAIL_CONFIG_ID = "MOCK_COURIER_EMAIL_CONFIG_ID";
process.env.COURIER_TENANT_ID = "MOCK_COURIER_TENANT_ID";

import uuid from "uuid";

import { get as mockGetConfiguration } from "~/lib/configurations-service";
import { get as mockGet } from "~/lib/notification-service";
import { get as mockGetDraft } from "~/lib/notification-service/draft";
import { listTenantUsers as mockListTenantUsers } from "~/lib/tenant-service";
import mockSend from "~/providers/test-notification-send";
import { handle } from "~/triggers/sqs/test-notification";
import fixtures from "./__fixtures__";

// required to stub out sentry integration
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/notification-service", () => {
  return {
    get: jest.fn(),
  };
});

jest.mock("~/lib/tenant-service", () => {
  return {
    get: jest.fn(),
    listTenantUsers: jest.fn(),
  };
});

jest.mock("~/lib/notification-service/draft", () => {
  return {
    get: jest.fn(),
  };
});

jest.mock("~/lib/brands", () => {
  return {
    get: jest.fn(),
    getDefault: jest.fn(),
  };
});

jest.mock("~/providers/test-notification-send", () => {
  return jest.fn();
});

jest.mock("~/lib/configurations-service", () => {
  return {
    get: jest.fn(),
  };
});

jest.mock("isomorphic-dompurify", () => {
  return {
    sanitize: (input: string, options: any) => input,
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

const mockConfigurationId = uuid.v4();

describe("notification test sent successfully", () => {
  const { notification, selectedChannel } = fixtures.success;
  const mockProviderResponse = "MOCK_PROVIDER_RESPONSE";
  const mockConfiguration = {
    id: mockConfigurationId,
    json: {
      provider: "sendgrid",
    },
  };

  beforeEach(async () => {
    (mockListTenantUsers as jest.Mock).mockResolvedValue([
      {
        email: "riley@courier.com",
        id: "123",
        verified: true,
      },
    ]);

    (mockGet as jest.Mock).mockResolvedValue(notification);
    (mockSend as jest.Mock).mockResolvedValue(mockProviderResponse);
    (mockGetConfiguration as jest.Mock).mockResolvedValue(mockConfiguration);
    await handle(fixtures.success.event);
  });

  it("should send to the provider successfully", () => {
    const providerSendPayload = (mockSend as jest.Mock).mock.calls[0][0];

    expect(providerSendPayload.config).toBe(mockConfiguration.json);
    expect(providerSendPayload.emailSubject).toBe(
      selectedChannel.config.email.emailSubject
    );
  });
});

describe("missing channel", () => {
  const { notification, channelId, event } = fixtures.missingChannel;

  beforeEach(() => {
    (mockGet as jest.Mock).mockResolvedValue(notification);
    (mockGetConfiguration as jest.Mock).mockResolvedValue({
      id: mockConfigurationId,
      json: {
        provider: "sendgrid",
      },
    });
  });

  it("should throw an error", async () => {
    const errorString = await handle(event).catch(String);
    expect(errorString).toBe(`Error: Cannot find channel: ${channelId}`);
  });
});

describe("missing configuration", () => {
  const { notification, event } = fixtures.success;

  beforeEach(() => {
    (mockGetConfiguration as jest.Mock).mockResolvedValue(undefined);
    (mockGet as jest.Mock).mockResolvedValue(notification);
  });

  it("should throw an error", async () => {
    const errorString = await handle(event).catch(String);

    expect(errorString).toBe(`Error: Cannot find Configuration`);
  });
});

describe("legacy notification", () => {
  const { notification, event } = fixtures.legacyNotification;

  beforeEach(() => {
    (mockGetConfiguration as jest.Mock).mockResolvedValue(undefined);
    (mockGet as jest.Mock).mockResolvedValue(notification);
  });

  it("should throw an error if we try to preview and old notification", async () => {
    const errorString = await handle(event).catch(String);
    expect(errorString).toBe(`Error: Cannot Preview Legacy Notifications`);
  });
});

describe("with draft", () => {
  const { draft, notification, event, selectedChannel } = fixtures.withDraftId;

  beforeEach(() => {
    (mockGetDraft as jest.Mock).mockResolvedValue(draft);
    (mockGetConfiguration as jest.Mock).mockResolvedValue({
      id: mockConfigurationId,
      json: {
        provider: "sendgrid",
      },
    });
    (mockGet as jest.Mock).mockResolvedValue(notification);
  });

  it("should use the draft if found", async () => {
    await handle(event);

    const providerSendPayload = (mockSend as jest.Mock).mock.calls[0][0];
    expect(providerSendPayload.emailSubject).toBe(
      selectedChannel.config.email.emailSubject
    );
  });
});
