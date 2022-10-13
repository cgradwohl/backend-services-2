import { gql } from "apollo-server-lambda";

export default gql`
  type Device {
    deviceId: String
  }

  type RecipientUserToken {
    token: String!
    status: String!
    providerKey: String!
    device: Device!
  }

  extend type Query {
    getRecipientUserTokens(userId: String!): [RecipientUserToken]!
  }
`;
