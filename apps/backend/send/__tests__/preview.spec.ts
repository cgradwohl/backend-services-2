import { MissingProvidersError, previewMessage } from "../preview";

import { ContentMessage, Recipient, UserRecipient } from "~/api/send/types";
import { listProviders } from "~/lib/configurations-service";
import { fetchAndMergeProfile } from "~/lib/dynamo/profiles";
import { get as getTenant } from "~/lib/tenant-service";
import { CourierObject, IConfigurationJson, ITenant } from "~/types.api";
import { IMessageBrands } from "../types";
import { getMessageBrands } from "../worker/commands/prepare/get-brand";

jest.mock("../worker/commands/prepare/get-brand");

jest.mock("~/lib/tenant-service");
jest.mock("~/lib/configurations-service");
jest.mock("~/lib/dynamo/profiles");

jest.mock("../worker/commands/prepare/get-brand");
jest.mock("~/lib/tracking-domains", () => ({
  getTrackingDomain: () => undefined,
}));

jest.mock("isomorphic-dompurify", () => {
  return {
    sanitize: (input: string, options: any) => input,
  };
});

jest.mock("~/lib/get-environment-variable");

const getTenantMock = getTenant as jest.Mock;
const listProvidersMock = listProviders as jest.Mock;
const fetchAndMergeProfileMock = fetchAndMergeProfile as jest.Mock;
const getMessageBrandsMock = getMessageBrands as jest.Mock;

const mockTenant: ITenant = {
  tenantId: "abc",
  name: "mock tenant",
  created: Date.now(),
  creator: "me",
};

const mockProvider: CourierObject<IConfigurationJson> = {
  id: "mockProvider",
  tenantId: mockTenant.tenantId,
  created: Date.now(),
  objtype: "configuration",
  creator: "me",
  title: "Sendgrid",
  json: {
    provider: "sendgrid",
  },
};

const mockBrands: IMessageBrands = {
  main: undefined,
  channels: undefined,
};

describe("preview", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should throw error if no providers returned", async () => {
    getTenantMock.mockImplementation(() => mockTenant);
    listProvidersMock.mockImplementation(() => []);
    fetchAndMergeProfileMock.mockImplementation(() => {});

    try {
      await previewMessage(mockTenant.tenantId, {
        to: [],
        content: {
          title: "hello",
          body: "world",
        },
      });
    } catch (ex) {
      expect(ex).toBeInstanceOf(MissingProvidersError);
    }
  });

  test("should route and preview a single message", async () => {
    getTenantMock.mockImplementation(() => mockTenant);
    listProvidersMock.mockImplementation(() => [mockProvider]);
    fetchAndMergeProfileMock.mockImplementation(() => ({
      mergedProfile: { email: "me@email.com " },
    }));
    getMessageBrandsMock.mockImplementation(() => mockBrands);
    expect.assertions(5);

    const message: ContentMessage = {
      to: [
        {
          user_id: "@me",
        },
      ],
      routing: {
        method: "single",
        channels: ["email"],
      },
      content: {
        title: "hello",
        body: "world",
      },
    };

    const response = await previewMessage(mockTenant.tenantId, message);

    expect(response.length).toBe(1);
    expect(response[0].routingSummary).toEqual([
      {
        channel: "email",
        provider: mockProvider.json.provider,
        configurationId: mockProvider.id,
        taxonomy: "email:sendgrid",
        selected: true,
      },
    ]);
    expect(response[0].userId).toEqual(
      ((message.to as Recipient[])[0] as UserRecipient).user_id
    );
    expect(response[0].channels.length).toBe(1);
    expect(response[0].channels[0]).toMatchSnapshot();
  });

  test("should handle routing/profile mismatch", async () => {
    getTenantMock.mockImplementation(() => mockTenant);
    listProvidersMock.mockImplementation(() => [mockProvider]);
    fetchAndMergeProfileMock.mockImplementation(() => ({
      mergedProfile: { phone_number: "5551234567" },
    }));
    getMessageBrandsMock.mockImplementation(() => mockBrands);
    expect.assertions(3);

    const message: ContentMessage = {
      to: [
        {
          user_id: "@me",
        },
      ],
      routing: {
        method: "single",
        channels: ["email"],
      },
      content: {
        title: "hello",
        body: "world",
      },
    };

    const response = await previewMessage(mockTenant.tenantId, message);

    expect(response.length).toBe(1);
    expect(response[0].routingSummary).toEqual([
      {
        channel: "email",
        provider: "sendgrid",
        reason:
          "Message is missing the minimum data required to send with this provider. Please check the message's profile and data properties and try again.",
        selected: false,
        type: "MISSING_PROVIDER_SUPPORT",
      },
    ]);
    expect(response[0].userId).toEqual(
      ((message.to as Recipient[])[0] as UserRecipient).user_id
    );
  });
});
