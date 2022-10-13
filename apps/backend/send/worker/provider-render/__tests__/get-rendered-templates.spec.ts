import { IProviderConfiguration, ISendMessageContext } from "~/send/types";
import { IChannel, INotificationWire, ITenant } from "~/types.api";
import { getRenderedTemplates } from "../get-rendered-templates";
import { renderBrand } from "../render-brand";

jest.mock("~/lib/capture-exception");
jest.mock("../render-brand");
jest.mock("isomorphic-dompurify", () => {
  return {
    sanitize: (input: string, options: any) => input,
  };
});
jest.mock("~/lib/get-environment-variable");

const tenantId = "mockTenantId";
const mockRenderBrand = renderBrand as jest.Mock;

describe("provider-render", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("basic email template request", () => {
    const mockChannelRendered: IChannel = {
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
          bestOf: [mockChannelRendered],
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

    const mockProviderConfig: IProviderConfiguration = {
      id: "mockProviderConfigurationId",
      json: {
        provider: "sendgrid",
      },
      created: 5,
      creator: "mockCreator",
      tenantId,
      objtype: "provider",
      title: "mockProvider",
    };

    const mockProfile = {
      email: "mock@email.com",
      tenantId: "mockTenantId",
      id: "mockId",
      updated: Date.now(),
    };

    const mockContext: ISendMessageContext = {
      content: mockNotificationWire,
      overrides: {
        channels: {
          email: {
            cc: "test@example.com",
            from: "test@example.com",
            // backend processing receives camel case
            replyTo: "test@example.com",
          },
        },
      },
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

    it(`should render an email with no blocks`, async () => {
      const results = await getRenderedTemplates(mockContext, {
        channel: "email",
        channelRendered: mockChannelRendered,
        providerConfig: mockProviderConfig,
      });

      expect(results.channelOverride).toEqual(
        mockContext.overrides.channels.email
      );

      expect(results.renderedTemplates).toMatchSnapshot();
    });

    it(`calls render brand`, async () => {
      expect.assertions(1);
      await getRenderedTemplates(mockContext, {
        channel: "email",
        channelRendered: mockChannelRendered,
        providerConfig: mockProviderConfig,
        brand: {} as any,
      });
      expect(mockRenderBrand).toHaveBeenCalledWith({
        brand: {},
        locale: undefined,
      });
    });
  });
});
