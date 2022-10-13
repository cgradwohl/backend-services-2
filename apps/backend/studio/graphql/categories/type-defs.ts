import { gql } from "apollo-server-lambda";

export default gql`
  type Category implements Node {
    categoryId: String!
    created: DateTime! @iso8601
    id: ID!
    name: String!
    updated: DateTime! @iso8601
  }

  extend type Query {
    category(categoryId: String!): Category
  }

  extend type Template {
    category: Category
  }
`;
