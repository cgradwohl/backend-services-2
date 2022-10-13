import { ContentMessage } from "~/api/send/types";
import { getSendRoutingStrategy } from "~/lib/send-routing";
import { RoutingStrategy } from "~/lib/send-routing/types";
import { extendRoutingStrategy } from "../extend-routing-strategy";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");
jest.mock("~/lib/send-routing");

const mockGetSendRoutingStrategy = getSendRoutingStrategy as jest.Mock;

jest.mock("~/lib/sentry");

describe("extend routing strategy - routing precedence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("should return default routing, as the routing strategy", async () => {
    expect.assertions(1);
    const defaultStrategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {},
      providers: {},
    };

    mockGetSendRoutingStrategy.mockResolvedValue(defaultStrategy);

    const message: ContentMessage = {
      to: {
        email: "foo@bar.com",
      },
      content: {
        title: "foo",
      },
    };
    const strategy = await extendRoutingStrategy(message, "tenantId");
    expect(strategy).toStrictEqual({
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {},
      providers: {},
    });
  });

  it("should return message routing, as the routing strategy", async () => {
    expect.assertions(1);
    const defaultStrategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {},
      providers: {},
    };

    mockGetSendRoutingStrategy.mockResolvedValue(defaultStrategy);

    const message: ContentMessage = {
      to: {
        email: "foo@bar.com",
      },
      content: {
        title: "foo",
      },
      routing: {
        method: "all",
        channels: ["sms", "email"],
      },
    };
    const strategy = await extendRoutingStrategy(message, "tenantId");
    expect(strategy).toStrictEqual({
      routing: {
        method: "all",
        channels: ["sms", "email"],
      },
      channels: {},
      providers: {},
    });
  });
});

describe("extend routing strategy - channel precedence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("should return channels from default routing strategy", async () => {
    expect.assertions(1);
    const defaultStrategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {
        email: {
          providers: ["sendgrid", "mailgun"],
          routing_method: "all",
        },
      },
      providers: {},
    };

    mockGetSendRoutingStrategy.mockResolvedValue(defaultStrategy);

    const message: ContentMessage = {
      to: {
        email: "foo@bar.com",
      },
      content: {
        title: "foo",
      },
    };

    const strategy = await extendRoutingStrategy(message, "tenantId");

    expect(strategy).toStrictEqual({
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {
        email: {
          providers: ["sendgrid", "mailgun"],
          routing_method: "all",
        },
      },
      providers: {},
    });
  });

  it("should return channels from message routing strategy", async () => {
    expect.assertions(1);
    const defaultStrategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {
        email: {
          providers: ["sendgrid", "mailgun"],
          routing_method: "all",
        },
      },
      providers: {},
    };

    mockGetSendRoutingStrategy.mockResolvedValue(defaultStrategy);

    const message: ContentMessage = {
      to: {
        email: "foo@bar.com",
      },
      content: {
        title: "foo",
      },
      channels: {
        email: {
          providers: ["gmail"],
          routing_method: "single",
        },
      },
    };

    const strategy = await extendRoutingStrategy(message, "tenantId");
    expect(strategy).toStrictEqual({
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {
        email: {
          providers: ["gmail"],
          routing_method: "single",
        },
      },
      providers: {},
    });
  });

  it("should extend channels from the default routing strategy with message channels", async () => {
    expect.assertions(1);
    const defaultStrategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {
        email: {
          providers: ["sendgrid", "mailgun"],
          routing_method: "all",
        },
      },
      providers: {},
    };

    mockGetSendRoutingStrategy.mockResolvedValue(defaultStrategy);

    const message: ContentMessage = {
      to: {
        email: "foo@bar.com",
      },
      content: {
        title: "foo",
      },
      channels: {
        sms: {
          providers: ["twilio"],
          routing_method: "single",
        },
      },
    };

    const strategy = await extendRoutingStrategy(message, "tenantId");

    expect(strategy).toStrictEqual({
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {
        email: {
          providers: ["sendgrid", "mailgun"],
          routing_method: "all",
        },
        sms: {
          providers: ["twilio"],
          routing_method: "single",
        },
      },
      providers: {},
    });
  });

  it("should extend channels from the message routing strategy with message channels", async () => {
    expect.assertions(1);
    const defaultStrategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["email"],
      },
      channels: {},
      providers: {},
    };

    mockGetSendRoutingStrategy.mockResolvedValue(defaultStrategy);

    const message: ContentMessage = {
      to: {
        email: "foo@bar.com",
      },
      content: {
        title: "foo",
      },
      routing: {
        method: "all",
        channels: ["email", "sms", "push"],
      },
      channels: {
        sms: {
          providers: ["twilio"],
          routing_method: "single",
          if: "foo === bar",
        },
      },
    };

    const strategy = await extendRoutingStrategy(message, "tenantId");
    expect(strategy).toStrictEqual({
      routing: {
        method: "all",
        channels: ["email", "sms", "push"],
      },
      channels: {
        sms: {
          providers: ["twilio"],
          routing_method: "single",
          if: "foo === bar",
        },
      },
      providers: {},
    });
  });
});
