import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    preferenceSection(id: String!): PreferenceSection
      @authorize(capability: "preferenceTemplate:ReadItem")
    preferenceSections: PreferenceSectionConnection
      @authorize(capability: "preferenceTemplate:ListItems")
  }

  extend type Mutation {
    savePreferenceSection(
      section: PreferenceSectionDataInput
    ): PreferenceSection @authorize(capability: "preferenceTemplate:WriteItem")
    addPreferenceGroup(
      sectionId: String!
      preferenceGroupId: String!
    ): PreferenceSection
    deletePreferenceSection(sectionId: String!): DeleteSectionResponse
  }

  type DeleteSectionResponse {
    success: Boolean
  }

  type PreferenceSection implements Node {
    hasCustomRouting: Boolean
    id: ID!
    isPublished: Boolean
    name: String
    routingOptions: [Channel]
    sectionId: String!
    updated: String
  }

  input PreferenceSectionDataInput {
    hasCustomRouting: Boolean
    name: String
    routingOptions: [Channel]
    sectionId: String
  }

  type PreferenceSectionEdge {
    cursor: String!
    node: PreferenceSection!
  }

  type PreferenceSectionConnection {
    edges: [PreferenceSectionEdge]!
    nodes: [PreferenceSection]!
    pageInfo: PageInfo
  }

  extend type PreferencesPage {
    sectionsByPage: PreferenceSectionConnection
      @authorize(capability: "preferenceTemplate:ListItems")
  }
`;
