import { IConfiguration } from "~/types.api";
import { INotificationWire } from "~/types.api";
import { get as getTenant } from "~/lib/tenant-service";
import objectService from "~/lib/dynamo/object-service";
import * as events from "~/lib/notification-service";
import * as prebuilt from "~/lib/notifications/prebuilt";

jest.mock("~/lib/notifications/prebuilt");

jest.mock("~/lib/tenant-service", () => {
  const get = jest.fn();
  return { get };
});

jest.mock("~/lib/dynamo/object-service", () => {
  const archive = jest.fn();
  const create = jest.fn();
  const get = jest.fn();
  const replace = jest.fn();
  const list = jest.fn();

  return jest.fn(() => ({
    archive,
    create,
    get,
    replace,
    list,
  }));
});

// test values
const id = "testId";
const tenantId = "testTenantId";
const userId = "testUserId";

const mockGetPrebuiltWelcomeTemplate =
  prebuilt.getWelcomePrebuiltTemplate as jest.Mock;
const mockGetTenant = getTenant as unknown as jest.Mock;
const mockObjectService = (objectService as jest.Mock)();

describe("DynamoDB Events", () => {
  afterEach(jest.clearAllMocks);

  describe("archive", () => {
    it("should get the item and archive it", async () => {
      mockObjectService.get.mockResolvedValue({});
      mockObjectService.archive.mockResolvedValue({});

      await expect(events.archive({ id, tenantId, userId })).resolves.toEqual(
        {}
      );

      expect(mockObjectService.get.mock.calls.length).toEqual(1);
      expect(mockObjectService.get.mock.calls[0]).toEqual([{ id, tenantId }]);
      expect(mockObjectService.archive.mock.calls.length).toEqual(1);
      expect(mockObjectService.archive.mock.calls[0]).toEqual([
        {
          id,
          tenantId,
          userId,
        },
      ]);
    });
  });

  describe("create", () => {
    let OLD_ENV;
    let env;

    beforeEach(() => {
      OLD_ENV = process.env;
      process.env = env = {
        ...OLD_ENV,
      };
    });
    afterEach(() => {
      process.env = OLD_ENV;
    });

    it("should use the object service create function", async () => {
      mockGetTenant.mockResolvedValue({ brandsAccepted: false });
      mockObjectService.create.mockResolvedValue({});

      const args = [
        { tenantId, userId },
        {
          json: {
            blocks: [],
            brandConfig: {
              enabled: false,
            },
            providers: {},
            strategyId: "testStrategyId",
          },
          title: "test",
        },
      ];

      await expect(events.create.apply(events, args)).resolves.toEqual({});
      expect(mockObjectService.create.mock.calls.length).toEqual(1);
      expect(mockObjectService.create.mock.calls[0]).toEqual(args);
    });

    it("should enable brands if the tenant has opted in", async () => {
      mockGetTenant.mockResolvedValue({ brandsAccepted: true });
      mockObjectService.create.mockResolvedValue({});

      const args = [
        { tenantId, userId },
        {
          json: {
            blocks: [],
            brandConfig: {
              enabled: true,
            },
            providers: {},
            strategyId: "testStrategyId",
          },
          title: "test",
        },
      ];

      await expect(events.create.apply(events, args)).resolves.toEqual({});
      expect(mockObjectService.create.mock.calls.length).toEqual(1);
      expect(mockObjectService.create.mock.calls[0]).toEqual(args);
    });
  });
});

describe("prebuilt templates", () => {
  afterEach(jest.clearAllMocks);

  it("should not create a prebuilt if no email provider is configured", async () => {
    const mockPrebuiltWelcomeTemplate: Partial<INotificationWire> = {
      json: {
        blocks: [],
        channels: {
          always: [],
          bestOf: [],
        },
      },
    };

    mockGetPrebuiltWelcomeTemplate.mockImplementation(
      () => mockPrebuiltWelcomeTemplate
    );
    mockGetTenant.mockResolvedValue({ brandsAccepted: true });
    mockObjectService.list.mockResolvedValue({
      objects: [],
    });

    const prebuiltTemplate = await events.createPrebuiltWelcomeTemplate({
      tenantId,
      userId,
    });

    expect(mockObjectService.create.mock.calls.length).toBe(0);
  });

  it("should create a prebuilt if email provider is configured", async () => {
    const mockPrebuiltWelcomeTemplate: Partial<INotificationWire> = {
      json: {
        blocks: [],
        channels: {
          always: [],
          bestOf: [],
        },
      },
    };

    mockGetPrebuiltWelcomeTemplate.mockImplementation(
      () => mockPrebuiltWelcomeTemplate
    );
    mockGetTenant.mockResolvedValue({ brandsAccepted: true });

    const mockEmailConfiguration: Partial<IConfiguration> = {
      id: "mockConfigurationId",
      json: {
        provider: "sendgrid",
      },
    };
    mockObjectService.list.mockResolvedValue({
      objects: [mockEmailConfiguration],
    });

    await events.createPrebuiltWelcomeTemplate({
      tenantId,
      userId,
    });

    expect(mockObjectService.create.mock.calls[0]).toEqual([
      {
        tenantId,
        userId,
      },
      {
        id: "courier-quickstart",
        json: {
          blocks: [],
          channels: {
            always: [],
            bestOf: [
              {
                providers: [
                  {
                    configurationId: mockEmailConfiguration.id,
                    key: mockEmailConfiguration.json.provider,
                  },
                ],
              },
            ],
          },
        },
      },
    ]);
  });
});
