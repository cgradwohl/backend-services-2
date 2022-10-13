import { getTemplateConfig } from "../get-template-config";
import { IBrand, IChannel } from "~/types.api";

jest.mock("~/lib/capture-exception");

const tenantId = "mockTenantId";

describe("get-template-config", () => {
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

    const mockProfile = {
      email: "mock@email.com",
      tenantId: "mockTenantId",
      id: "mockId",
      updated: Date.now(),
    };

    it(`should create the correct templateConfig`, async () => {
      const results = getTemplateConfig({
        tenantId,
        channel: "email",
        profile: mockProfile,
        channelConfig: mockChannelToRender,
      });
      expect(results).toEqual({
        channel: "email",
        brand: {
          enabled: false,
          email: undefined,
        },
        email: {},
        locale: undefined,
        partials: undefined,
        push: {
          clickAction: undefined,
          icon: undefined,
          title: undefined,
        },
        tenantId,
      });
    });
  });

  describe("branded email", () => {
    const mockChannelToRender: IChannel = {
      blockIds: [],
      id: "mockChannelId",
      taxonomy: "email:sendgrid",
      config: {
        email: {
          emailSubject: "mockSubject",
        },
        push: {
          icon: undefined,
          clickAction: undefined,
          title: "mockTitle",
        },
      },
      providers: [
        {
          key: "sendgrid",
          configurationId: "mockConfigurationId",
        },
      ],
    };

    const mockProfile = {
      email: "mock@email.com",
      tenantId: "mockTenantId",
      id: "mockId",
      locale: "mockLocale",
      updated: Date.now(),
    };

    const mockBrand: IBrand = {
      id: "mockBrandId",
      created: 123,
      updated: 456,
      updater: "mockUpdater",
      name: "mockBrand",
      version: "mockVersion",
      creator: "mockCreator",
      settings: {
        email: {
          header: {
            inheritDefault: false,
            barColor: "red",
            logo: {
              href: "https://www.courier.com",
              image: "https://www.courier.com/logo.png",
            },
          },
        },
      },
    };

    it(`should create the correct templateConfig`, async () => {
      const results = getTemplateConfig({
        channel: "email",
        title: "mockSubject",
        channelConfig: mockChannelToRender,
        tenantId,
        profile: mockProfile,
        brand: mockBrand,
      });

      expect(results).toEqual({
        channel: "email",
        brand: {
          enabled: true,
          email: mockBrand.settings.email,
        },
        email: mockChannelToRender.config.email,
        push: mockChannelToRender.config.push,
        tenantId,
        locale: mockProfile.locale,
        partials: undefined,
      });
    });
  });

  describe("push notification", () => {
    it("should set the title", () => {
      const results = getTemplateConfig({
        channel: "email",
        title: "mockSubject",
        tenantId,
        profile: {} as any,
      });

      expect(results.push.title).toEqual("mockSubject");
    });
  });

  describe("in-app", () => {
    it("should pass the provider config through", () => {
      const results = getTemplateConfig({
        channel: "email",
        title: "mockSubject",
        tenantId,
        profile: {} as any,
        providerConfig: {
          id: "mockId",
          created: 123,
          tenantId: "mockTenantId",
          creator: "mockCreator",
          title: "Mock Configuration",
          objtype: "configuration",
          json: {
            provider: "courier",
            version: "markdown",
          },
        },
      });

      expect(results["version"]).toEqual("markdown");
    });
  });
});
