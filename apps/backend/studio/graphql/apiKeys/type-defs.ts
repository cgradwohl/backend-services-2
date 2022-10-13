import { gql } from "apollo-server-lambda";

export default gql`
  input AddKeyInput {
    dryRunKey: String
    scope: String!
    name: String
  }

  type ApiKey implements Node {
    id: ID!
    name: String
    scope: String!
    dryRunKey: String
    created: DateTime! @iso8601
  }

  type ApiKeyEdge {
    cursor: String!
    node: ApiKey!
  }

  type ApiKeyConnection {
    edges: [ApiKeyEdge]!
    nodes: [ApiKey]!
    pageInfo: PageInfo
  }

  type DeleteKeyResponse {
    success: Boolean!
  }

  type CreateKeyResponse {
    success: Boolean!
  }

  type RotateKeyResponse {
    token: String!
  }

  extend type Mutation {
    deleteKey(key: String!): DeleteKeyResponse!
      @authorize(capability: "apikey:WriteItem")
    createKey(fields: AddKeyInput!): CreateKeyResponse!
      @authorize(capability: "apikey:WriteItem")
    rotateKey(key: String!): RotateKeyResponse!
      @authorize(capability: "apikey:RotateKey")
  }

  extend type Query {
    apiKey(key: ID!): ApiKey! @authorize(capability: "apikey:ReadItem")
    apiKeys: ApiKeyConnection! @authorize(capability: "apikey:ListItems")
  }
`;
