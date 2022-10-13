import { gql } from "apollo-server-lambda";

export default gql`
  type Tag implements Node {
    color: String
    created: DateTime! @iso8601
    id: ID!
    name: String!
    tagId: String!
  }

  extend type Query {
    tag(tagId: String!): Tag
  }

  extend type Template {
    tags: [Tag]
  }
`;
