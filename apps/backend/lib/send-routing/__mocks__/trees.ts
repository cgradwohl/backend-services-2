import { RouteNode } from "../types";

// Generated from (with some manual tweaks to rep edge case)
// routing: {
//   method: "single",
//   channels: ["sms", "email"],
// },
export const complexSmsAndEmailTree: RouteNode = {
  address: [],
  nodes: [
    {
      address: [0],
      nodes: [
        {
          channel: "sms",
          provider: "twilio",
          providerConfigurationId: "7593c6b6-f241-47f0-85b4-b5386cd60086",
          taxonomy: "direct_message:sms:twilio",
          address: [0, 0],
          providerFailoverIndex: 1,
          type: "leaf",
        },
        {
          failureReason: "unknown",
          failureType: "FILTERED",
          channel: "sms",
          provider: "shrug",
          address: [0, 1],
          type: "dead-leaf",
        },
      ],
      type: "branch",
      failover: {
        address: [0, "failover"],
        nodes: [
          {
            channel: "sms",
            provider: "vonage",
            providerConfigurationId: "7593c6b6-f241-47f0-85b4-vonage",
            taxonomy: "direct_message:sms:vonage",
            address: [0, "failover", 0],
            providerFailoverIndex: 2,
            type: "leaf",
          },
        ],
        type: "branch",
        failover: {
          address: [0, "failover", "failover"],
          // // To make this extra tricky we make this a send to "all" strategy
          nodes: [
            {
              channel: "sms",
              provider: "sinch",
              providerConfigurationId: "7593c6b6-f241-47f0-85b4-sinch",
              taxonomy: "direct_message:sms:sinch",
              address: [0, "failover", "failover", 0],
              providerFailoverIndex: 3,
              type: "leaf",
            },
            {
              address: [0, "failover", "failover", 1],
              nodes: [
                {
                  channel: "sms",
                  provider: "abc",
                  providerConfigurationId: "7593c6b6-f241-47f0-85b4-abc",
                  taxonomy: "direct_message:sms:abc",
                  address: [0, "failover", "failover", 1, 0],
                  providerFailoverIndex: 3,
                  type: "leaf",
                },
              ],
              type: "branch",
              failover: {
                address: [0, "failover", "failover", 1, "failover"],
                nodes: [
                  {
                    channel: "sms",
                    provider: "123",
                    providerConfigurationId: "7593c6b6-f241-47f0-85b4-123",
                    taxonomy: "direct_message:sms:123",
                    address: [0, "failover", "failover", 1, "failover", 0],
                    providerFailoverIndex: 4,
                    type: "leaf",
                  },
                ],
                type: "branch",
              },
            },
          ],
          type: "branch",
        },
      },
    },
  ],
  type: "branch",
  failover: {
    address: ["failover"],
    nodes: [
      {
        address: ["failover", 0],
        nodes: [
          {
            channel: "email",
            provider: "mailjet",
            providerConfigurationId: "7593c6b6-f241-47f0-85b4-b5386cd600er6",
            taxonomy: "email:mailjet",
            address: ["failover", 0, 0],
            providerFailoverIndex: 1,
            type: "leaf",
          },
        ],
        type: "branch",
        failover: {
          address: ["failover", 0, "failover"],
          nodes: [
            {
              channel: "email",
              provider: "sendgrid",
              providerConfigurationId: "2321",
              taxonomy: "email:sendgrid",
              address: ["failover", 0, "failover", 0],
              providerFailoverIndex: 2,
              type: "leaf",
            },
          ],
          type: "branch",
        },
      },
    ],
    type: "branch",
  },
};
