import { RouteNode } from "../../types";
import { getRouteNode } from "../get-route-node";

describe("get route node", () => {
  it("should return the correct standard node", () => {
    expect(getRouteNode([0, 0], tree)).toBe((tree as any).nodes[0].nodes[0]);
  });

  it("should return the correct failover node", () => {
    expect(getRouteNode(["failover", 0, "failover", 0], tree)).toBe(
      (tree as any).failover.nodes[0].failover.nodes[0]
    );
  });
});

// Generated from
// routing: {
//   method: "single",
//   channels: ["sms", "email"],
// },
const tree: RouteNode = {
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
