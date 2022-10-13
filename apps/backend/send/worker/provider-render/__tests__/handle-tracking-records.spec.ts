import { handleTrackingRecords } from "../handle-tracking-records";
import {
  IChannel,
  IChannelProvider,
  INotificationWire,
  ITenant,
} from "~/types.api";
import { ISendMessageContext } from "~/send/types";

import { saveClickThroughTrackingRecords } from "~/lib/tracking-service/save-click-through-tracking";

jest.mock("~/lib/capture-exception");
jest.mock("~/lib/tracking-service/save-click-through-tracking");

const mockSaveClickThroughTrackingRecords =
  saveClickThroughTrackingRecords as jest.Mock;

const tenantId = "mockTenantId";

describe("handle-tracking-records", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("basic tenant", () => {
    const mockProviderToRender: IChannelProvider = {
      key: "sendgrid",
      configurationId: "mockConfigurationId",
    };

    const mockChannelToRender: IChannel = {
      blockIds: [],
      id: "mockChannelId",
      taxonomy: "email:sendgrid",
      providers: [mockProviderToRender],
    };

    const mockNotificationWire: INotificationWire = {
      created: 123,
      updated: 123,
      tenantId,
      id: "mockId",
      objtype: "event",
      title: "mockTitle",
      creator: "mockCreator",
      json: {
        blocks: [],
        channels: {
          always: [],
          bestOf: [mockChannelToRender],
        },
      },
    };

    const mockTenant: ITenant = {
      tenantId,
      created: 123,
      creator: "mockCreator",
      name: "mockTenant",
      defaultBrandId: undefined,
    };

    const mockProfile = {
      email: "mock@email.com",
      tenantId: "mockTenantId",
      id: "mockId",
      updated: Date.now(),
    };

    const mockProviderConfig = {
      created: 123,
      creator: "mockCreator",
      objtype: "configuration",
      title: "MockTitle",
      tenantId: mockTenant.tenantId,
      json: {
        provider: "sendgrid",
      },
      id: mockProviderToRender.configurationId,
    };

    const mockContext: ISendMessageContext = {
      content: mockNotificationWire,
      profile: mockProfile,
      environment: "production",
      scope: "published",
      tenant: mockTenant,
      variableData: {
        messageId: "foo",
        courier: {
          environment: "production",
          scope: "published",
        },
        profile: mockProfile,
        openTrackingId: "mockOpenTrackingId",
        urls: {
          opened: "mockOpenedUrl",
          unsubscribe: "mockUnsubscribeUrl",
        },
      },
      providers: [mockProviderConfig],
      brands: { channels: {} },
    };

    it(`should default click tracking to false and open tracking to true`, async () => {
      const mockOpenTrackingId = "mockOpenTrackingId";
      const mockResolvedValue = "mockResolvedValue";
      mockSaveClickThroughTrackingRecords.mockResolvedValue(mockResolvedValue);

      const results = await handleTrackingRecords(mockContext, {
        channelRendered: mockChannelToRender,
        providerConfig: mockProviderConfig,
        trackingRecords: {
          links: {},
          openTrackingId: mockOpenTrackingId,
        },
        messageId: "mmid",
        taxonomy: "email",
      });

      expect(mockSaveClickThroughTrackingRecords.mock.calls[0][0]).toEqual({
        channel: mockChannelToRender,
        clickThroughTrackingEnabled: false,
        emailOpenTrackingEnabled: true,
        links: {},
        message: {
          messageId: "mmid",
          tenantId: "mockTenantId",
        },
        openTrackingId: mockOpenTrackingId,
        notification: mockContext.content,
        providerConfig: mockProviderConfig,
        recipientId: mockContext.profile?.user_id,
        variableData: mockContext?.variableData,
      });

      expect(results).toEqual(mockResolvedValue);
    });
  });

  describe("click tracking enabled tenant", () => {
    const mockProviderToRender: IChannelProvider = {
      key: "sendgrid",
      configurationId: "mockConfigurationId",
    };

    const mockChannelToRender: IChannel = {
      blockIds: [],
      id: "mockChannelId",
      taxonomy: "email:sendgrid",
      providers: [mockProviderToRender],
    };

    const mockNotificationWire: INotificationWire = {
      created: 123,
      updated: 123,
      tenantId,
      id: "mockId",
      objtype: "event",
      title: "mockTitle",
      creator: "mockCreator",
      json: {
        blocks: [],
        channels: {
          always: [],
          bestOf: [mockChannelToRender],
        },
      },
    };

    const mockTenant: ITenant = {
      tenantId,
      created: 123,
      creator: "mockCreator",
      name: "mockTenant",
      defaultBrandId: undefined,
      clickThroughTracking: {
        enabled: true,
      },
      emailOpenTracking: {
        enabled: false,
      },
    };

    const mockProfile = {
      email: "mock@email.com",
      tenantId: "mockTenantId",
      id: "mockId",
      updated: Date.now(),
    };

    const mockProviderConfig = {
      created: 123,
      creator: "mockCreator",
      objtype: "configuration",
      title: "MockTitle",
      tenantId: mockTenant.tenantId,
      json: {
        provider: "sendgrid",
      },
      id: mockProviderToRender.configurationId,
    };

    const mockContext: ISendMessageContext = {
      content: mockNotificationWire,
      profile: mockProfile,
      environment: "production",
      scope: "published",
      tenant: mockTenant,
      variableData: {
        messageId: "foo",
        courier: {
          environment: "production",
          scope: "published",
        },
        profile: mockProfile,
        openTrackingId: "mockOpenTrackingId",
        urls: {
          opened: "mockOpenedUrl",
          unsubscribe: "mockUnsubscribeUrl",
        },
      },
      providers: [mockProviderConfig],
      brands: { channels: {} },
    };

    it(`should save click tracking to true and open tracking to false`, async () => {
      const mockOpenTrackingId = "mockOpenTrackingId";
      const mockResolvedValue = "mockResolvedValue";
      mockSaveClickThroughTrackingRecords.mockResolvedValue(mockResolvedValue);

      const results = await handleTrackingRecords(mockContext, {
        channelRendered: mockChannelToRender,
        providerConfig: mockProviderConfig,
        trackingRecords: {
          links: {},
          openTrackingId: mockOpenTrackingId,
        },
        messageId: "mmid",
        taxonomy: "email",
      });

      expect(mockSaveClickThroughTrackingRecords.mock.calls[0][0]).toEqual({
        channel: mockChannelToRender,
        clickThroughTrackingEnabled: true,
        emailOpenTrackingEnabled: false,
        links: {},
        message: {
          messageId: "mmid",
          tenantId: "mockTenantId",
        },
        notification: mockContext.content,
        openTrackingId: mockOpenTrackingId,
        providerConfig: mockProviderConfig,
        recipientId: mockContext.profile?.user_id,
        variableData: mockContext?.variableData,
      });

      expect(results).toEqual(mockResolvedValue);
    });
  });
});
