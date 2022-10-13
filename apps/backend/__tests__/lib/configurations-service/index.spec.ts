import * as configurations from "~/lib/configurations-service";
import extractConfiguration from "~/lib/notifications/extract-configurations";
import upgradeNotification from "~/lib/notifications/upgrade";
import {
  CourierObject,
  IConfigurationJson,
  ILegacyNotificationWire,
  INotificationWire,
} from "~/types.api";

jest.mock("~/lib/notifications/extract-configurations");
const extractConfigurationMock = extractConfiguration as any;

jest.mock("~/lib/notifications/upgrade");
const upgradeNotificationMock = upgradeNotification as any;

describe("DynamoDB Configurations", () => {
  describe("module", () => {
    it("should have functions for manipulating configurations", () => {
      expect(configurations).toEqual({
        archive: expect.any(Function),
        batchGet: expect.any(Function),
        create: expect.any(Function),
        get: expect.any(Function),
        getByProvider: expect.any(Function),
        getConfigurationByEnv: expect.any(Function),
        hasConfiguration: expect.any(Function),
        list: expect.any(Function),
        listProviders: expect.any(Function),
        replace: expect.any(Function),
      });
    });
  });

  const LEGACY_NOTIFICATION: Readonly<ILegacyNotificationWire> = {
    created: 1241241241111,
    creator: "asdfadsafsdafsdafsadf",
    id: "id",
    json: {
      blocks: [],
      providers: {},
      strategyId: "fdsafasdfsadfsadfsadf",
    },
    objtype: "event",
    tenantId: "tenantId",
    title: "title",
  };

  const NOTIFICATION: Readonly<INotificationWire> = {
    created: 1241241241111,
    creator: "asdfadsafsdafsdafsadf",
    id: "id",
    json: {
      blocks: [],
      channels: { always: [], bestOf: [] },
    },
    objtype: "event",
    tenantId: "tenantId",
    title: "title",
  };

  describe("when checking if a Notification has a configuration", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("will return false if arg is legacy notification", async () => {
      extractConfigurationMock.mockReturnValue([]);
      upgradeNotificationMock.mockResolvedValue(NOTIFICATION);

      const result = await configurations.hasConfiguration("configurationId")(
        LEGACY_NOTIFICATION
      );

      expect(result).toBe(false);
      expect(upgradeNotificationMock.mock.calls.length).toBe(1);
      expect(upgradeNotificationMock.mock.calls[0][0]).toStrictEqual(
        LEGACY_NOTIFICATION
      );
      expect(extractConfigurationMock.mock.calls.length).toBe(1);
    });

    it("will return false and call extractConfiguration if configurationId is not found in a notification", async () => {
      extractConfigurationMock.mockReturnValue([]);

      const result = await configurations.hasConfiguration("configurationId")(
        NOTIFICATION
      );

      expect(result).toBe(false);
      expect(upgradeNotificationMock.mock.calls.length).toBe(0);
      expect(extractConfigurationMock.mock.calls.length).toBe(1);
    });

    it("will throw if notification is something else", async () => {
      await expect(
        configurations.hasConfiguration("configurationId")({} as any)
      ).rejects.toThrow(Error);
      expect(upgradeNotificationMock.mock.calls.length).toBe(0);
      expect(extractConfigurationMock.mock.calls.length).toBe(0);
    });
  });

  describe("when getting a configuration by environment", () => {
    it("will return the correct information", () => {
      const json: IConfigurationJson = {
        propOne: "one",
        propTwo: "two",
        provider: "sendgrid",
        test: {
          propOne: "three",
          propTwo: "four",
          provider: "sendgrid",
        },
      };
      const configuration: CourierObject<IConfigurationJson> = {
        created: 12134141241241,
        creator: "a-creator",
        id: "an-id",
        json,
        objtype: "configuration",
        tenantId: "a-tenant",
        title: "Configuration",
      };

      const result = configurations.getConfigurationByEnv(
        configuration,
        "test"
      );

      expect(result).toStrictEqual({
        created: 12134141241241,
        creator: "a-creator",
        id: "an-id",
        json: {
          propOne: "three",
          propTwo: "four",
          provider: "sendgrid",
        },
        objtype: "configuration",
        tenantId: "a-tenant",
        title: "test - Configuration",
      });
    });

    it("will return the original config if the requested env doesn't exist", () => {
      const json: IConfigurationJson = {
        propOne: "one",
        propTwo: "two",
        provider: "sendgrid",
      };
      const configuration: CourierObject<IConfigurationJson> = {
        created: 12134141241241,
        creator: "a-creator",
        id: "an-id",
        json,
        objtype: "configuration",
        tenantId: "a-tenant",
        title: "Configuration",
      };

      const result = configurations.getConfigurationByEnv(
        configuration,
        "test"
      );

      expect(result).toStrictEqual({
        created: 12134141241241,
        creator: "a-creator",
        id: "an-id",
        json: {
          propOne: "one",
          propTwo: "two",
          provider: "sendgrid",
        },
        objtype: "configuration",
        tenantId: "a-tenant",
        title: "Configuration",
      });
    });
  });
});
