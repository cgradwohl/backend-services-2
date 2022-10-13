import { templateV1RoutingSummaryToTree } from "../template-routing-summary-to-tree";

describe("templateV1RoutingSummaryToTree", () => {
  it("should produce a tree that sends to sms and fails over to APN", () => {
    const result = templateV1RoutingSummaryToTree(smsFailoverToTreeSummary);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "address": Array [],
        "nodes": Array [
          Object {
            "address": Array [
              0,
            ],
            "failover": Object {
              "address": Array [
                0,
                "failover",
              ],
              "failover": undefined,
              "nodes": Array [
                Object {
                  "address": Array [
                    0,
                    "failover",
                    0,
                  ],
                  "channel": "push",
                  "provider": "apn",
                  "providerConfigurationId": undefined,
                  "providerFailoverIndex": 2,
                  "taxonomy": undefined,
                  "templateChannelId": undefined,
                  "type": "leaf",
                },
              ],
              "type": "branch",
            },
            "nodes": Array [
              Object {
                "address": Array [
                  0,
                  0,
                ],
                "channel": "sms",
                "provider": "twilio",
                "providerConfigurationId": "0e73a906-564b-4e56-8dd6-22b79b59a12e",
                "providerFailoverIndex": 1,
                "taxonomy": "direct_message:sms:*",
                "templateChannelId": "8f6854a3-8b27-4e14-b6e0-20c048b07bac",
                "type": "leaf",
              },
            ],
            "type": "branch",
          },
        ],
        "type": "branch",
      }
    `);
  });
});

const smsFailoverToTreeSummary: any = {
  always: [],
  bestOf: [
    {
      channel: "sms",
      channelLabel: "sms",
      provider: "twilio",
      selected: true,
      key: "twilio",
      configurationId: "0e73a906-564b-4e56-8dd6-22b79b59a12e",
      config: {
        locales: {},
      },
      blockIds: ["21ad5872-e9ef-4687-a523-8ad790ecc901"],
      id: "8f6854a3-8b27-4e14-b6e0-20c048b07bac",
      providers: [
        {
          key: "twilio",
          configurationId: "0e73a906-564b-4e56-8dd6-22b79b59a12e",
          config: {},
        },
      ],
      taxonomy: "direct_message:sms:*",
      disabled: false,
      label: "",
    },
    {
      channel: "push",
      channelLabel: "push-undefined",
      provider: "apn",
      reason: "Better match found",
      selected: false,
      canUseForFailover: true,
    },
  ],
};
