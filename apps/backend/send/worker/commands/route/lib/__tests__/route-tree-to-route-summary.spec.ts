import { RouteNode } from "~/lib/send-routing";
import { routeTreeToRouteSummary } from "../route-tree-to-route-summary";

describe("route tree to route summary", () => {
  it("should emit a well formed summary", () => {
    expect(routeTreeToRouteSummary(routing)).toMatchSnapshot();
  });
});

const routing: RouteNode = {
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
      },
    },
    {
      channel: "email",
      failureType: "FILTERED",
      failureReason: "Channel conditional failed",
      address: [1],
      type: "dead-branch",
    },
  ],
  type: "branch",
};
