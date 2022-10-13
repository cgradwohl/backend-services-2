import { RoutingStrategy, RoutingSummary } from "~/lib/send-routing/types";
import {
  applyNotificationToRoutingSummary,
  generateRoutingSummary,
} from "../generate-routing-summary";

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

describe("generate route summary", () => {
  describe("generateRoutingSummary", () => {
    it("should return a valid summary from a basic strategy", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "all",
          channels: ["sms", "email"],
        },
        channels: {},
        providers: {},
      };

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: { phone_number: "1234567890", email: "drew@ycourier.com" },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "sms",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd60086",
            "provider": "twilio",
            "selected": true,
            "taxonomy": "direct_message:sms:twilio",
          },
          Object {
            "channel": "email",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd600er6",
            "provider": "mailjet",
            "selected": true,
            "taxonomy": "email:mailjet",
          },
        ]
      `);
    });

    it("should handle a single method strategy", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "single",
          channels: ["sms", "email"],
        },
        channels: {},
        providers: {},
      };

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: { phone_number: "1234567890", email: "drew@ycourier.com" },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "sms",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd60086",
            "provider": "twilio",
            "selected": true,
            "taxonomy": "direct_message:sms:twilio",
          },
        ]
      `);
    });

    it("should respect channel provider restrictions", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "all",
          channels: ["sms", "email"],
        },
        channels: {
          sms: {
            providers: ["vonage"],
          },
          email: {
            providers: ["sendgrid"],
          },
        },
        providers: {},
      };

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: { phone_number: "1234567890", email: "drew@ycourier.com" },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "sms",
            "configurationId": "7593c6b6-f241-47f0-85b4-vonage",
            "provider": "vonage",
            "selected": true,
            "taxonomy": "direct_message:sms:vonage",
          },
          Object {
            "channel": "email",
            "configurationId": "2321",
            "provider": "sendgrid",
            "selected": true,
            "taxonomy": "email:sendgrid",
          },
        ]
      `);
    });

    it("should respect channel conditionals", async () => {
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

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: { locale: "en-US" },
          profile: { phone_number: "1234567890", email: "drew@ycourier.com" },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "sms",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd60086",
            "provider": "twilio",
            "selected": true,
            "taxonomy": "direct_message:sms:twilio",
          },
          Object {
            "channel": "email",
            "provider": "",
            "reason": "Channel conditional failed",
            "selected": false,
            "type": "FILTERED",
          },
        ]
      `);
    });

    it("should respect provider conditionals", async () => {
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

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: { locale: "en-US" },
          profile: { phone_number: "1234567890", email: "drew@courier.com" },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "sms",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd60086",
            "provider": "twilio",
            "selected": true,
            "taxonomy": "direct_message:sms:twilio",
          },
          Object {
            "channel": "email",
            "provider": "",
            "reason": "No remaining configured providers for channel or channel is invalid",
            "selected": false,
            "type": "NO_PROVIDERS",
          },
        ]
      `);
    });

    it("should allow providers to be channels", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "all",
          channels: ["mailjet"],
        },
        channels: {},
        providers: {},
      };

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: { email: "drew@courier.com" },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "mailjet",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd600er6",
            "provider": "mailjet",
            "selected": true,
            "taxonomy": "email:mailjet",
          },
        ]
      `);
    });

    it("should handle misspelled channels and providers without puking", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "all",
          channels: ["mailet", "eml"],
        },
        channels: {},
        providers: {},
      };

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: { email: "drew@courier.com" },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "mailet",
            "provider": "",
            "reason": "No remaining configured providers for channel or channel is invalid",
            "selected": false,
            "type": "NO_PROVIDERS",
          },
          Object {
            "channel": "eml",
            "provider": "",
            "reason": "No remaining configured providers for channel or channel is invalid",
            "selected": false,
            "type": "NO_PROVIDERS",
          },
        ]
      `);
    });

    it("should call channel handles", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "all",
          channels: ["sms"],
        },
        channels: {},
        providers: {},
      };

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: {},
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "sms",
            "provider": "twilio",
            "reason": "Message is missing the minimum data required to send with this provider. Please check the message's profile and data properties and try again.",
            "selected": false,
            "type": "MISSING_PROVIDER_SUPPORT",
          },
          Object {
            "channel": "sms",
            "provider": "vonage",
            "reason": "Message is missing the minimum data required to send with this provider. Please check the message's profile and data properties and try again.",
            "selected": false,
            "type": "MISSING_PROVIDER_SUPPORT",
          },
        ]
      `);
    });

    it("should pass tokens to handles and produce correct summaries", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "all",
          channels: ["apn"],
        },
        channels: {},
        providers: {},
      };

      const apnSummaries = await Promise.all([
        generateRoutingSummary({
          strategy,
          providerConfigs,
          params: {
            data: {},
            profile: {},
          },
        }),
        generateRoutingSummary({
          strategy,
          providerConfigs,
          tokens: { apn: [{ token: "hello!" } as any] },
          params: {
            data: {},
            profile: {},
          },
        }),
      ]);

      expect(apnSummaries).toMatchInlineSnapshot(`
        Array [
          Array [
            Object {
              "channel": "apn",
              "provider": "apn",
              "reason": "Message is missing the minimum data required to send with this provider. Please check the message's profile and data properties and try again.",
              "selected": false,
              "type": "MISSING_PROVIDER_SUPPORT",
            },
          ],
          Array [
            Object {
              "channel": "apn",
              "configurationId": "f2661ebd-dd91-417c-8b37-a9870fd0cbf4",
              "provider": "apn",
              "selected": true,
              "taxonomy": "push:apn",
            },
          ],
        ]
      `);
    });

    it("should respect channel routing_method", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "single",
          channels: ["push"],
        },
        channels: {
          push: {
            routing_method: "all",
            providers: ["apn", "airship"],
          },
        },
        providers: {},
      };

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: {
            apn: {
              token: "YOUR TOKEN",
            },
            airship: {
              audience: {
                named_user: "MEEEE",
              },
              device_types: ["ios"],
            },
          },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "push",
            "configurationId": "f2661ebd-dd91-417c-8b37-a9870fd0cbf4",
            "provider": "apn",
            "selected": true,
            "taxonomy": "push:apn",
          },
          Object {
            "channel": "push",
            "configurationId": "a0e317ae-b30b-482f-a503-5e772e234f65",
            "provider": "airship",
            "selected": true,
            "taxonomy": "push:airship",
          },
        ]
      `);
    });

    it("should not duplicate sms providers", async () => {
      const strategy: RoutingStrategy = {
        routing: {
          method: "all",
          channels: ["sms"],
        },
        channels: {
          sms: {
            providers: ["twilio"],
          },
        },
        providers: {},
      };

      const summary = await generateRoutingSummary({
        strategy,
        providerConfigs,
        params: {
          data: {},
          profile: { phone_number: "1234567890" },
        },
      });

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "sms",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd60086",
            "provider": "twilio",
            "selected": true,
            "taxonomy": "direct_message:sms:twilio",
          },
        ]
      `);
    });

    it("should handle sub-routing strategies", async () => {
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

      const summary = await generateRoutingSummary({
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

      expect(summary).toMatchInlineSnapshot(`
        Array [
          Object {
            "channel": "sms",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd60086",
            "provider": "twilio",
            "selected": true,
            "taxonomy": "direct_message:sms:twilio",
          },
          Object {
            "channel": "email",
            "configurationId": "7593c6b6-f241-47f0-85b4-b5386cd600er6",
            "provider": "mailjet",
            "selected": true,
            "taxonomy": "email:mailjet",
          },
        ]
      `);
    });
  });

  describe("applyNotificationToRoutingSummary", () => {
    const summary: RoutingSummary[] = [
      {
        channel: "email",
        configurationId: "b46abb6b-e99e-473b-927a-7d9843ec0442",
        provider: "mailjet",
        selected: true,
        taxonomy: "email:mailjet",
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

    it("should leave routing summary alone if no notification", () => {
      const result = applyNotificationToRoutingSummary(summary);
      expect(result).toEqual(summary);
    });

    it("should add relevant information if notification", () => {
      const result = applyNotificationToRoutingSummary(summary, notification);
      expect(result).toMatchSnapshot();
    });
  });
});
