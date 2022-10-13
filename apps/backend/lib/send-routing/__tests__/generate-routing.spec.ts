import { applyTemplateChannelId, generateRouting } from "../generate-routing";
import * as callProviderHandlesModule from "../lib/call-provider-handles";
import { RouteLeaf, RoutingStrategy } from "../types";

describe("generate routing", () => {
  beforeEach(jest.clearAllMocks);

  it("should generate a valid tree from an all method routing config", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "all",
        channels: ["sms", "email"],
      },
      channels: {},
      providers: {},
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: {},
        profile: {
          phone_number: "1234567890",
          email: "drew@ycourier.com",
        },
      },
    });

    expect(routing).toMatchSnapshot();
  });

  it("should generate a valid tree from an single method routing config", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["sms", "email"],
      },
      channels: {},
      providers: {},
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: {},
        profile: {
          phone_number: "1234567890",
          email: "drew@ycourier.com",
        },
      },
    });

    expect(routing).toMatchSnapshot();
  });

  it("should generate dead leafs for providers that could not be selected", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["sms", "email"],
      },
      channels: {},
      providers: {},
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: {},
        profile: {
          email: "drew@ycourier.com",
        },
      },
    });

    expect(routing).toMatchSnapshot();
  });

  it("should produce a complex tree where a channel sends to more than one provider in a single call", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "single",
        channels: ["push", "sms"],
      },
      channels: {
        push: {
          routing_method: "all",
          providers: ["apn", "firebase-fcm"],
        },
      },
      providers: {},
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: {},
        profile: {
          phone_number: "1234567890",
          email: "drew@ycourier.com",
          apn: { token: "foo" },
          firebaseToken: "bar",
        },
      },
    });

    // The resulting tree should have both of these providers selected alongside each other.
    // It should also have an sms failover branch.
    expect(routing).toMatchSnapshot();
  });

  it("should evaluate configured channel conditionals and exclude the email channel as a result", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "all",
        channels: ["sms", "email"],
      },
      channels: {
        sms: {
          if: "data.locale === 'en-US'",
        },
        email: {
          if: "data.locale === 'eu-FR'",
        },
      },
      providers: {},
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: { locale: "en-US" },
        profile: { phone_number: "1234567890", email: "drew@ycourier.com" },
      },
    });

    expect(routing).toMatchSnapshot();
  });

  it("should evaluate provider conditionals and exclude mailjet as a result", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "all",
        channels: ["sms", "email"],
      },
      channels: {
        sms: {
          providers: ["twilio"],
        },
        email: {
          providers: ["mailjet"],
        },
      },
      providers: {
        twilio: {
          if: "data.locale === 'en-US'",
        },
        mailjet: {
          if: "data.locale === 'eu-FR'",
        },
      },
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: { locale: "en-US" },
        profile: { phone_number: "1234567890", email: "drew@courier.com" },
      },
    });

    expect(routing).toMatchSnapshot();
  });

  it("should allow providers to be channels", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "all",
        channels: ["mailjet"],
      },
      channels: {},
      providers: {},
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: {},
        profile: { email: "drew@courier.com" },
      },
    });

    expect(routing).toMatchSnapshot();
  });

  it("should handle misspelled channels and providers without puking", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "all",
        channels: ["mailet", "eml"],
      },
      channels: {},
      providers: {},
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: {},
        profile: { email: "drew@courier.com" },
      },
    });

    expect(routing).toMatchSnapshot();
  });

  it("should call provider handles function and use the result", async () => {
    expect.assertions(3);
    const strategy: RoutingStrategy = {
      routing: {
        method: "all",
        channels: ["vonage"],
      },
      channels: {},
      providers: {},
    };
    const opts = {
      strategy,
      providerConfigs,
      params: {
        data: {},
        profile: {},
      },
    };

    const mockCallProviderHandles = jest.spyOn(
      callProviderHandlesModule,
      "callProviderHandles"
    );

    // MISSING_PROVIDER_SUPPORT case
    mockCallProviderHandles.mockReturnValue(Promise.resolve(false));
    const routing = await generateRouting(opts);
    expect(routing).toMatchSnapshot();

    // PROVIDER_ERROR case
    mockCallProviderHandles.mockReturnValue(Promise.reject(new Error()));
    const routing2 = await generateRouting(opts);
    expect(routing2).toMatchSnapshot();

    // Success case
    mockCallProviderHandles.mockResolvedValue(Promise.resolve(true));
    const routing3 = await generateRouting(opts);
    expect(routing3).toMatchSnapshot();

    mockCallProviderHandles.mockRestore();
  });

  it("should pass tokens to provider handles functions", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "all",
        channels: ["apn"],
      },
      channels: {},
      providers: {},
    };

    const apnTrees = await Promise.all([
      generateRouting({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: {},
        },
      }),
      generateRouting({
        strategy,
        providerConfigs,
        tokens: { apn: [{ token: "hello!" } as any] },
        params: {
          data: {},
          profile: {},
        },
      }),
    ]);

    expect(apnTrees).toMatchSnapshot();
  });

  it("should generate a tree with recursive routing strategies", async () => {
    expect.assertions(1);
    const strategy: RoutingStrategy = {
      routing: {
        method: "all",
        channels: [
          {
            method: "single",
            channels: ["sms", "push"],
          },
          {
            method: "single",
            channels: ["email", "slack"],
          },
        ],
      },
      channels: {},
      providers: {},
    };

    const routing = await generateRouting({
      strategy,
      providerConfigs,
      params: {
        data: {},
        profile: {
          email: "drew@courier.com",
          phone_number: "1234567890",
          apn: {
            token: "YOUR TOKEN",
          },
        },
      },
    });

    expect(routing).toMatchSnapshot();
  });

  describe("applyLegacyTemplateChannelId", () => {
    const leaf: RouteLeaf = {
      channel: "email",
      providerConfigurationId: "b46abb6b-e99e-473b-927a-7d9843ec0442",
      provider: "mailjet",
      taxonomy: "email:mailjet",
      providerFailoverIndex: 1,
      type: "leaf",
      address: [],
    };

    it("should leave routing summary alone if no notification", () => {
      const result = applyTemplateChannelId(leaf);
      expect(result).toEqual(leaf);
    });

    it("should add relevant information if notification", () => {
      const result = applyTemplateChannelId(leaf, notification);
      expect(result.templateChannelId).toEqual(
        "6721af5a-7d56-4906-a021-6f30fe84253a"
      );
    });
  });
});

const providerConfigs: any = [
  {
    json: {
      domain: "sandboxb1d4dd0eb044497987e3c14f3c7c4db6.mailgun.org",
      apiKey: "4cea38609bdedcd992c18fd595a55a6d-7b8c9ba8-91e9abcd",
      fromAddress: "cmoney@example.com",
      provider: "apn",
    },
    id: "f2661ebd-dd91-417c-8b37-a9870fd0cbf4",
  },
  {
    json: {
      domain: "sandboxb1d4dd0eb044497987e3c14f3c7c4db6.mailgun.org",
      apiKey: "4cea38609bdedcd992c18fd595a55a6d-7b8c9ba8-91e9abcd",
      fromAddress: "cmoney@example.com",
      provider: "firebase-fcm",
    },
    id: "fsdkjhf-fdsf-sdf-sdfs-sdffsdf",
  },
  {
    json: {
      apiKey: "SG.gf.df",
      fromAddress: "chris@courier.com",
      checkDeliveryStatus: false,
      provider: "airship",
    },
    id: "a0e317ae-b30b-482f-a503-5e772e234f65",
  },
  {
    json: {
      accountSid: "wetwetgs",
      authToken: "tewthfdadfdf",
      messagingServiceSid: "greswetwtre",
      provider: "twilio",
    },
    id: "7593c6b6-f241-47f0-85b4-b5386cd60086",
  },
  {
    json: {
      accountSid: "wetwetgs",
      authToken: "tewthfdadfdf",
      messagingServiceSid: "greswetwtre",
      provider: "vonage",
    },
    id: "7593c6b6-f241-47f0-85b4-vonage",
  },
  {
    json: {
      accountSid: "wretewrtwq",
      authToken: "wtewetsgfdgssdgf",
      messagingServiceSid: "sdfgsdfgfdsdssdfg",
      provider: "mailjet",
    },
    id: "7593c6b6-f241-47f0-85b4-b5386cd600er6",
  },
  {
    json: {
      accountSid: "GSGDSewrewrewr",
      authToken: "gdfsgferger345sfa",
      messagingServiceSid: "sdfsggfdsdfsgfsdfger",
      provider: "sendgrid",
    },
    id: "2321",
  },
  {
    json: {
      accountSid: "gsdfds4353454",
      authToken: "324323423423",
      messagingServiceSid: "adsfasadfaswewr",
      provider: "slack",
    },
    id: "slack2e1231",
  },
];

const notification: any = {
  json: {
    channels: {
      always: [
        {
          channel: "email",
          channelLabel: "Email",
          provider: "mailjet",
          selected: true,
          key: "mailjet",
          configurationId: "b46abb6b-e99e-473b-927a-7d9843ec0442",
          config: {
            email: {
              emailSubject: "My Test Subject {name}",
              emailTemplateConfig: {
                templateName: "none",
                topBarColor: "#9121C2",
              },
              renderPlainText: false,
            },
            locales: {},
          },
          conditional: {
            filters: [
              {
                source: "data",
                property: "do_email",
                value: "true",
                operator: "EQUALS",
                id: "af4fc93d-4321-4737-9556-e8954d33a9ad",
              },
            ],
            logicalOperator: "and",
            behavior: "hide",
          },
          blockIds: ["92e08808-8883-4034-be2f-d372df5db3c1"],
          id: "6721af5a-7d56-4906-a021-6f30fe84253a",
          providers: [
            {
              key: "mailjet",
              configurationId: "b46abb6b-e99e-473b-927a-7d9843ec0442",
              config: {},
              conditional: {
                filters: [
                  {
                    source: "data",
                    property: "dont",
                    value: "true",
                    operator: "EQUALS",
                    id: "278a9468-8159-4518-8554-8212d7e3c9fd",
                  },
                ],
                logicalOperator: "and",
                behavior: "hide",
              },
            },
          ],
          taxonomy: "email:*",
          disabled: false,
          label: "Email",
        },
      ],
    },
  },
};
