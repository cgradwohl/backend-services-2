import { gql } from "apollo-server-lambda";

export const PreferenceSections = gql`
  extend type Query {
    preferenceSections: PreferenceSectionConnection
  }

  type PreferenceSection implements Node {
    hasCustomRouting: Boolean
    id: ID!
    name: String
    routingOptions: [Channel]
    sectionId: String!
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

  extend type PreferencePage {
    sections: PreferenceSectionConnection
  }
`;
