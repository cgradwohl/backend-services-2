import { gql } from "apollo-server-lambda";

export default gql`
  type Brand implements Node {
    brandId: String!
    created: DateTime! @iso8601
    id: ID!
    name: String!
    updated: DateTime! @iso8601
  }

  extend type Query {
    brand(brandId: String!): Brand
  }

  extend type Template {
    brand: Brand
  }

  extend type TemplateDraft {
    brand: Brand
  }
`;
