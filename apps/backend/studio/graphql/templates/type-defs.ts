import { gql } from "apollo-server-lambda";

export default gql`
  extend type Mutation {
    addPrebuiltTemplate(templateName: String): AddPrebuiltTemplateResponse!
      @authorize(capability: "template:WriteItem")
  }

  extend type Query {
    template(templateId: String!): Template
  }

  type AddPrebuiltTemplateResponse {
    templateId: String
  }

  type Template implements Node {
    archived: Boolean
    brandEnabled: Boolean
    brandId: String
    categoryId: String
    created: DateTime! @iso8601
    draftId: String
    draft: TemplateDraft
    eventMaps: EventMapConnection
    id: ID!
    name: String!
    tagIds: [String]
    templateId: String!
    updated: DateTime @iso8601
  }

  type TemplateDraft {
    brandEnabled: Boolean
    brandId: String
    created: DateTime! @iso8601
    draftId: String!
    id: ID!
    updated: DateTime! @iso8601
  }

  type EventMapConnection {
    edges: [EventMapEdge]!
    nodes: [EventMap]!
    pageInfo: PageInfo
  }

  type EventMapEdge {
    cursor: String!
    node: EventMap!
  }

  type EventMap {
    created: DateTime! @iso8601
    eventId: String!
    id: ID!
    updated: DateTime! @iso8601
  }

  type TemplateEdge {
    cursor: String!
    node: Template!
  }

  type TemplateConnection {
    edges: [TemplateEdge]!
    nodes: [Template]!
    pageInfo: PageInfo
  }

  extend type PreferenceTemplate {
    notificationTemplates: TemplateConnection
  }
`;
