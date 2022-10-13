# Send Routing

The send routing lib contains utilities to facilitate routing for v2 send.

This includes:

- `generate-routing#generateRouting` A function that generates a routing tree that the routing function can then use
  to dispatch send function calls. The tree includes failover strategies in the event that a provider
  send fails
- `routing-strategy-store` This module includes functions for saving various routing strategies.
  As of writing we only save a `default` routing strategy. This is automatically loaded when
  a v2 send does not include `message.routing`.

# Failover

The Routing Tree returned by `generateRouting` includes a failover strategy. See `failover.spec.md`
for more info.

# Annotated Routing Tree

Given the following v2 send message:

```ts
const message = {
  message: {
    routing: {
      method: "single",
      channels: ["push", "sms"]
    },
    channels: {
      push: {
        routing_method: "all",
        providers: ["apn", "firebase-fcm"]
      }
    }
    content: { /** Doesn't matter*/ }
  }
}
```

This tree will be generated:

```ts
export const complexSmsAndEmailTree: RouteNode = {
  // The first node in a complete routing tree will always be a branch. Branches can contain other nodes
  // and an optional failover node if sending to every one of it's child nodes fails.
  type: "branch",

  // Every node has an address which represents it's location. Because this is the root node it
  // Is an empty array.
  address: [],

  // The children of a Branch. When we route a branch route to all of the nodes it contains.
  // Think of it as a routing method "all".
  nodes: [
    // The first child node is another branch. This branch represents the "push" channel. Channels
    // are always represented as a branch in the tree
    {
      type: "branch",

      // Each item an address represents the index of the node within a branch by level
      // because this is the first node of the root branch it is 0
      address: [0],

      // We send to every node listed. Because the push channel is configured to use both
      // "apn" and "firebase-fcm" at the same time, we list both in these nodes.
      // In the event that a send to every leaf within a branch fails, we use the branches
      // failover node.
      nodes: [
        // Each leaf represents a provider to send to
        {
          type: "leaf",
          channel: "push",
          provider: "twilio",
          providerConfigurationId: "7593c6b6-f241-47f0-85b4-b5386cd60086",
          taxonomy: "push:mobile:apn",
          // This address means the the leaf's parent is the first node of the root and it is the first child of its parent
          address: [0, 0],
          // The provider failover index is used to determine when a send to a provider should timeout
          // A provider times out when currentTimeMs() >= firstSendWithChannelTimeMs + providerTimeoutMs * providerFailover index
          // Provider failover index can also be determined by Math.max(address.filter(a => a === "failover").length, 1)
          providerFailoverIndex: 1,
        },
        {
          type: "leaf",
          channel: "sms",
          provider: "vonage",
          providerConfigurationId: "7593c6b6-f241-47f0-85b4-vonage",
          taxonomy: "push:mobile:firebase-fcm",
          // This address means the the leaf's parent is the first node of the root and it is the second child of its parent
          address: [0, 1],
          providerFailoverIndex: 1,
        },
      ],

      // Because this branch has no failover strategy, we would instead try and use the parent
      // failover strategy.
    },
  ],
  failover: {
    // Failover branches use the string "failover" instead of an index to signify it's location
    address: ["failover"],
    nodes: [
      {
        type: "branch",

        // This means we are the first node of the root failover branch
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

        // The failover branch has it's own failover branch. So if sending to mailjet fails we use this.
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
  },
};
```
