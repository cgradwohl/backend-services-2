import { gql } from "apollo-server-lambda";

export default gql`
  extend type Mutation {
    disableWebhook(webhookId: String!): ToggleWebhookResponse
      @authorize(capability: "webhook:WriteItem")
    enableWebhook(webhookId: String!): ToggleWebhookResponse
      @authorize(capability: "webhook:WriteItem")
    retrieveWebhookSecret(webhookId: String!): WebhookSecretResponse!
      @authorize(capability: "webhook:WriteItem")
    rotateWebhookSecret(webhookId: String!): WebhookSecretResponse!
      @authorize(capability: "webhook:WriteItem")
    saveWebhook(webhook: SaveWebhookInput!): SaveWebhookResponse!
      @authorize(capability: "webhook:WriteItem")
  }

  extend type Query {
    webhook(webhookId: String!): Webhook
      @authorize(capability: "webhook:ReadItem")
    webhooks(after: String, first: Int): WebhookConnection!
      @authorize(capability: "webhook:ListItems")
  }

  input SaveWebhookInput {
    description: String
    name: String
    url: String!
    webhookId: String
  }

  type SaveWebhookResponse {
    archived: Boolean!
    description: String
    name: String
    url: String!
    webhookId: String!
  }

  type ToggleWebhookResponse {
    archived: Boolean!
    webhookId: String!
  }

  type WebhookSecretResponse {
    webhookId: String!
    webhookSecret: String!
  }

  type Webhook implements Node {
    archived: Boolean!
    created: DateTime! @iso8601
    description: String
    events: [String]!
    id: ID!
    name: String!
    secret: String!
    tenantId: String!
    updated: DateTime! @iso8601
    url: String!
    webhookId: String!
  }

  type WebhookConnection {
    edges: [WebhookEdge]!
    nodes: [Webhook]!
    pageInfo: PageInfo
  }

  type WebhookEdge {
    cursor: String!
    node: Tenant!
  }
`;
