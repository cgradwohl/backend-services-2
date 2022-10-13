import { gql } from "apollo-server-lambda";

export default gql`
  interface Node {
    id: ID!
  }

  extend type Query {
    node(id: ID!): Node
  }
`;
