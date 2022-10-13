import { gql } from "apollo-server-lambda";

export default gql`
  type SendVolumeResponse {
    label: String!
    sent: Int!
    errors: Int!
    opened: Float!
    clicked: Float!
  }

  type ChannelPerformanceResponse {
    downstream: String!
    sent: Int!
    errors: Int!
    clicked: Int!
    delivered: Int!
    opened: Int!
  }

  extend type Query {
    getSendVolume(
      channel: String
      relative: String
      templateId: String!
    ): [SendVolumeResponse]! @authorize(capability: "analytics:View")

    getChannelPerformance(
      channel: String
      relative: String
      templateId: String!
    ): [ChannelPerformanceResponse]! @authorize(capability: "analytics:View")
  }
`;
