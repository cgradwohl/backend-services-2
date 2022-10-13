import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    preferenceTemplate(id: String!): PreferenceTemplate
      @authorize(capability: "preferenceTemplate:ReadItem")
    preferenceTemplates: PreferenceTemplateConnection!
      @authorize(capability: "preferenceTemplate:ListItems")
  }

  extend type Mutation {
    savePreferenceTemplate(
      template: PreferenceTemplateDataInput!
      isCopying: Boolean
    ): PreferenceTemplate!
      @authorize(capability: "preferenceTemplate:WriteItem")

    attachResourceToPreferenceTemplate(
      templateId: String!
      resourceType: ResourceType!
      resourceId: String!
    ): PreferenceTemplateAttachmentResponse!
      @authorize(capability: "preferenceTemplate:WriteItem")
  }

  input PreferenceTemplateDataInput {
    templateName: String!
    defaultStatus: PreferenceStatus
    allowedPreferences: [PreferenceRuleType]
    templateId: String
    routingOptions: [Channel]
    isArchived: Boolean
  }

  type PreferenceTemplate implements Node {
    allowedPreferences: [PreferenceRuleType]
    created: DateTime! @iso8601
    creatorId: String!
    defaultStatus: PreferenceStatus
    id: ID!
    isArchived: Boolean
    isPublished: Boolean
    linkedNotifications: Int!
    routingOptions: [Channel]
    templateId: String!
    templateName: String!
    updated: DateTime! @iso8601
    updaterId: String
  }

  type PreferenceTemplateAttachmentResponse {
    lastUpdated: String!
    lastUpdatedBy: String!
    resourceId: String!
    resourceType: ResourceType!
  }

  enum ResourceType {
    notifications
    lists
    subscriptions
  }

  enum Channel {
    direct_message
    email
    push
  }

  enum PreferenceRuleType {
    channel_preferences
    snooze
  }

  enum PreferenceStatus {
    OPTED_IN
    OPTED_OUT
    REQUIRED
  }

  type PreferenceTemplateConnection {
    edges: [PreferenceTemplateEdge]!
    nodes: [PreferenceTemplate]!
    pageInfo: PageInfo
  }

  type PreferenceTemplateEdge {
    cursor: String!
    node: PreferenceTemplate!
  }

  extend type PreferenceSection {
    preferenceGroups: PreferenceTemplateConnection
  }
`;
