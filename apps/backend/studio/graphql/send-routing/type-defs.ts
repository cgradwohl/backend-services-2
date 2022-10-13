import { gql } from "apollo-server-lambda";

export default gql`
  type RoutingStrategy {
    routing: JSON
    channels: JSON
    providers: JSON
  }

  input RoutingStrategyInput {
    routing: JSON
    channels: JSON
    providers: JSON
  }

  type SetSendRoutingStrategyResponse {
    success: Boolean!
  }

  extend type Query {
    sendRoutingStrategy: RoutingStrategy!
  }

  extend type Mutation {
    setSendRoutingStrategy(
      strategy: RoutingStrategyInput
    ): SetSendRoutingStrategyResponse!
  }
`;
