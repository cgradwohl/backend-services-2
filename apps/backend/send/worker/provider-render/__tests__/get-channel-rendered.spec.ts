import { ISendMessageContext } from "~/send/types";
import { IChannel, INotificationWire, ITenant } from "~/types.api";
import { getChannelRendered } from "../get-channel-rendered";

jest.mock("~/lib/capture-exception");

const tenantId = "mockTenantId";

describe("get-channel-to-render", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("basic email", () => {
    const mockChannelToRender: IChannel = {
      blockIds: [],
      id: "mockChannelId",
      taxonomy: "email:sendgrid",
      providers: [
        {
          key: "sendgrid",
          configurationId: "mockConfigurationId",
        },
      ],
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
      },
      providers: [],
      brands: { channels: {} },
    };

    it(`should return undefined if no channel found`, async () => {
      const results = getChannelRendered(
        mockContext,
        "badChannelId",
        "mockConfigurationId"
      );

      expect(results).toEqual({});
    });

    it(`should find the right channel`, async () => {
      const results = getChannelRendered(
        mockContext,
        "mockChannelId",
        "mockConfigurationId"
      );
      expect(results).toEqual({
        channelRendered: mockChannelToRender,
        providerRendered: mockChannelToRender.providers[0],
      });
    });
  });
});
