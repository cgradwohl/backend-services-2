import { providerHandles } from "~/workers/route/provider-handles";
import createVariableHandler from "~/lib/variable-handler";
import uuid from "uuid";

import {
  CourierObject,
  IConfigurationJson,
  IConditionalConfig,
} from "~/types.api";

const channelLabel = "Channel Label";
const channelName = "email";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

jest.mock("~/providers", () => {
  return {
    selectedProvider: {
      deliveryStatusStrategy: "POLLING",
      handles: () => {
        return true;
      },
      taxonomy: {
        channel: "push",
      },
    },
    unselectedProvider: {
      deliveryStatusStrategy: "POLLING",
      handles: () => {
        return false;
      },
      taxonomy: {
        channel: "push",
      },
    },
    asyncProvider: {
      deliveryStatusStrategy: "POLLING",
      handles: async () => {
        await wait(500);
        return true;
      },
      taxonomy: {
        channel: "push",
      },
    },
  };
});

const mockConfig: CourierObject<IConfigurationJson> = {
  id: uuid.v4(),
  objtype: "configuration",
  tenantId: uuid.v4(),
  title: "Mock Config",
  creator: "Mock Creator",
  updated: Date.now(),
  created: Date.now(),
  json: {
    provider: "selectedProvider",
  },
};

describe("workers/route/provider-handles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let variableHandler;

  beforeEach(() => {
    variableHandler = createVariableHandler({
      value: {
        data: {},
        profile: {
          email: "me@mail.com",
        },
      },
    });
  });

  describe("provider.selected === false", () => {
    it("will throw an error without config", async () => {
      const provider = {
        key: "unselected",
      };

      const result = await providerHandles(
        channelName,
        channelLabel,
        variableHandler,
        undefined,
        provider
      );

      expect(result).toEqual({
        channel: channelName,
        channelLabel,
        provider: provider.key,
        reason: "MISSING_CONFIGURATION",
        selected: false,
      });
    });

    it("will handle filtering out a provider", async () => {
      const channelLabel = "Channel Label";
      const conditional: IConditionalConfig = {
        filters: [
          {
            source: "profile",
            operator: "EQUALS",
            property: "email",
            value: "me@mail.com",
          },
        ],
      };

      const provider = { key: "filtered", conditional };

      const result = await providerHandles(
        channelName,
        channelLabel,
        variableHandler,
        mockConfig,
        provider
      );

      expect(result).toEqual({
        channel: channelName,
        channelLabel,
        conditional,
        provider: provider.key,
        reason: "FILTERED_AT_PROVIDER",
        selected: false,
      });
    });

    it("will handle an invalid provider", async () => {
      const provider = {
        key: "badProvider",
      };

      const result = await providerHandles(
        channelName,
        channelLabel,
        variableHandler,
        {
          ...mockConfig,
          json: {
            provider: provider.key,
          },
        },
        provider
      );

      expect(result).toEqual({
        channel: channelName,
        channelLabel,
        provider: provider.key,
        reason: "MISSING_PROVIDER_SUPPORT",
        selected: false,
      });
    });

    it("will handle an invalid provider", async () => {
      const provider = {
        key: "unselectedProvider",
      };

      const result = await providerHandles(
        channelName,
        channelLabel,
        variableHandler,
        {
          ...mockConfig,
          json: {
            provider: provider.key,
          },
        },
        provider
      );

      expect(result).toEqual({
        channel: channelName,
        channelLabel,
        provider: provider.key,
        reason: "INCOMPLETE_PROFILE_DATA",
        selected: false,
      });
    });
  });

  describe("provider.selected === true", () => {
    it("will select a provider", async () => {
      const channelName = "email";
      const provider = {
        key: "selectedProvider",
      };
      const result = await providerHandles(
        channelName,
        channelLabel,
        variableHandler,
        mockConfig,
        provider
      );

      expect(result).toEqual({
        channel: channelName,
        channelLabel,
        provider: provider.key,
        reason: undefined,
        selected: true,
      });
    });

    it("will select a provider with async handles", async () => {
      const provider = {
        key: "asyncProvider",
      };
      const result = await providerHandles(
        channelName,
        channelLabel,
        variableHandler,
        {
          ...mockConfig,
          json: {
            provider: provider.key,
          },
        },
        provider
      );

      expect(result).toEqual({
        channel: channelName,
        channelLabel,
        provider: provider.key,
        reason: undefined,
        selected: true,
      });
    });
  });
});
