import uuid from "uuid";
import createVariableHandler from "~/lib/variable-handler";
import { channelHandles } from "~/workers/route/channel-handles";

import { CourierObject, IChannel, IConfigurationJson } from "~/types.api";

const tenantId = uuid.v4();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const selectedProviderId = uuid.v4();
const unselectedProviderId = uuid.v4();

const configMap: {
  [key: string]: CourierObject<IConfigurationJson>;
} = {
  [selectedProviderId]: {
    id: selectedProviderId,
    objtype: "configuration",
    tenantId,
    title: "Mock Config",
    creator: "Mock Creator",
    updated: Date.now(),
    created: Date.now(),
    json: {
      provider: "selectedProvider",
    },
  },
  [unselectedProviderId]: {
    id: unselectedProviderId,
    objtype: "configuration",
    tenantId,
    title: "Mock Config",
    creator: "Mock Creator",
    updated: Date.now(),
    created: Date.now(),
    json: {
      provider: "unselectedProvider",
    },
  },
};

const disabledChannel: IChannel = {
  id: uuid.v4(),
  blockIds: [],
  disabled: true,
  taxonomy: "email:*",
  providers: [
    {
      configurationId: selectedProviderId,
      key: "selectedProvider",
    },
  ],
};

const filteredChannel: IChannel = {
  id: uuid.v4(),
  blockIds: [],
  disabled: false,
  taxonomy: "email:*",
  conditional: {
    filters: [
      {
        source: "profile",
        operator: "EQUALS",
        property: "email",
        value: "me@mail.com",
      },
    ],
  },
  providers: [
    {
      configurationId: selectedProviderId,
      key: "selectedProvider",
    },
  ],
};

const invalidProvider: IChannel = {
  id: uuid.v4(),
  blockIds: [],
  disabled: false,
  taxonomy: "email:*",
  providers: [
    {
      key: "selectedProvider",
    },
  ],
};

const unselectedProvider: IChannel = {
  id: uuid.v4(),
  blockIds: [],
  disabled: false,
  taxonomy: "email:*",
  providers: [
    {
      configurationId: unselectedProviderId,
      key: "unselectedProvider",
    },
  ],
};

const selectedProvider: IChannel = {
  id: uuid.v4(),
  blockIds: [],
  disabled: false,
  taxonomy: "email:*",
  providers: [
    {
      configurationId: selectedProviderId,
      key: "selectedProvider",
    },
  ],
};

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

  describe("no channels selected", () => {
    it("will handle disabled channel", async () => {
      const result = await channelHandles(
        variableHandler,
        [disabledChannel],
        configMap
      );

      expect(result).toEqual({
        channel: undefined,
        channelProvider: undefined,
        channelsSummary: [
          {
            channel: "email",
            channelLabel: "email",
            reason: "CHANNEL_DISABLED",
            selected: false,
          },
        ],
      });
    });

    it("will handle filtered channel", async () => {
      const result = await channelHandles(
        variableHandler,
        [filteredChannel],
        configMap
      );

      expect(result).toEqual({
        channel: undefined,
        channelProvider: undefined,
        channelsSummary: [
          {
            channel: "email",
            channelLabel: "email",
            conditional: filteredChannel.conditional,
            reason: "FILTERED_OUT_AT_CHANNEL",
            selected: false,
          },
        ],
      });
    });

    it("will handle invalid provider", async () => {
      const result = await channelHandles(
        variableHandler,
        [invalidProvider],
        configMap
      );

      expect(result).toEqual({
        channel: undefined,
        channelProvider: undefined,
        channelsSummary: [
          {
            channel: "email",
            channelLabel: "email",
            reason: "MISSING_CONFIGURATION_ID",
            selected: false,
          },
        ],
      });
    });

    it("will handle unselected provider", async () => {
      const result = await channelHandles(
        variableHandler,
        [unselectedProvider],
        configMap
      );

      expect(result).toEqual({
        channel: undefined,
        channelProvider: undefined,
        channelsSummary: [
          {
            channel: "email",
            channelLabel: "email",
            provider: "unselectedProvider",
            reason: "INCOMPLETE_PROFILE_DATA",
            selected: false,
          },
        ],
      });
    });
  });

  it("will keep track of all unselected channels", async () => {
    const result = await channelHandles(
      variableHandler,
      [disabledChannel, filteredChannel, invalidProvider, unselectedProvider],
      configMap
    );

    expect(result).toEqual({
      channel: undefined,
      channelProvider: undefined,
      channelsSummary: [
        {
          channel: "email",
          channelLabel: "email",
          reason: "CHANNEL_DISABLED",
          selected: false,
        },
        {
          channel: "email",
          channelLabel: "email",
          conditional: filteredChannel.conditional,
          reason: "FILTERED_OUT_AT_CHANNEL",
          selected: false,
        },
        {
          channel: "email",
          channelLabel: "email",
          conditional: undefined,
          reason: "MISSING_CONFIGURATION_ID",
          selected: false,
        },
        {
          channel: "email",
          channelLabel: "email",
          provider: "unselectedProvider",
          reason: "INCOMPLETE_PROFILE_DATA",
          selected: false,
        },
      ],
    });
  });

  describe("channels selected", () => {
    it("will return selected channels and provider", async () => {
      const result = await channelHandles(
        variableHandler,
        [selectedProvider],
        configMap
      );

      expect(result).toEqual({
        channel: selectedProvider,
        channelProvider: {
          configurationId: selectedProviderId,
          key: "selectedProvider",
        },
        channelsSummary: [
          {
            channel: "email",
            channelLabel: "email",
            provider: "selectedProvider",
            reason: undefined,
            selected: true,
          },
        ],
      });
    });
  });

  it("will keep track of all channel up to the selected one", async () => {
    const result = await channelHandles(
      variableHandler,
      [
        disabledChannel,
        filteredChannel,
        selectedProvider,
        invalidProvider,
        unselectedProvider,
      ],
      configMap
    );

    expect(result).toEqual({
      channel: selectedProvider,
      channelProvider: {
        configurationId: selectedProviderId,
        key: "selectedProvider",
      },
      channelsSummary: [
        {
          channel: "email",
          channelLabel: "email",
          reason: "CHANNEL_DISABLED",
          selected: false,
        },
        {
          channel: "email",
          channelLabel: "email",
          conditional: filteredChannel.conditional,
          reason: "FILTERED_OUT_AT_CHANNEL",
          selected: false,
        },
        {
          channel: "email",
          channelLabel: "email",
          provider: "selectedProvider",
          reason: undefined,
          selected: true,
        },
      ],
    });
  });
});
