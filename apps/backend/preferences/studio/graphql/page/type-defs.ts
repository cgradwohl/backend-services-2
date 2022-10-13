import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    preferencesPage: PreferencesPage
      @authorize(capability: "preferenceTemplate:ReadItem")
  }

  extend type Mutation {
    publishPreferencesPage: PreferencesPage!
      @authorize(capability: "preferenceTemplate:WriteItem")
  }

  type PreferencesPage implements Node {
    draftPreviewUrl: String!
    id: ID!
    pageId: String!
    publishedAt: DateTime @iso8601
    publishedBy: String
    publishedPreviewUrl: String
    publishedVersion: String
  }
`;
