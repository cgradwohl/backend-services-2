import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    automationTemplate(templateId: String!): AutomationTemplate
    automationTemplates: AutomationTemplateConnection!
    automationSchedule(templateId: String!): ScheduleItemConnection!
    automationSources(templateId: String!): AutomationSourceConnection!
  }

  extend type Mutation {
    deleteAutomationTemplate(templateId: String!): String!
    publishAutomationTemplate(
      templateId: String!
    ): PublishAutomationTemplateResponse!
    saveAutomationTemplate(
      template: IAutomationTemplateDataInput!
    ): AutomationTemplate!
    updateAlias(alias: String!, templateId: String!): UpdateAliasResponse!
    updateCancelationToken(
      token: JSON
      templateId: String!
    ): UpdateCancelationTokenResponse!
    updateAutomationTemplateName(
      name: String!
      templateId: String!
    ): UpdateAutomationTemplateNameResponse!
    saveAutomationScheduleItem(item: ScheduleItemInput!): ScheduleItem!
    deleteAutomationScheduleItem(templateId: String!, itemId: String!): String!
    saveAutomationSource(
      templateId: String!
      newSource: String!
      oldSource: String
    ): AutomationSource!
    deleteAutomationSource(templateId: String!, source: String!): String!
  }

  input IAutomationTemplateDataInput {
    alias: String
    cancelation_token: JSON
    json: JSON
    id: ID
    name: String!
    template: String
    templateId: String!
    createdAt: String
    publishedVersion: String
    publishedAt: String
  }

  type AutomationTemplate implements Node {
    alias: String!
    cancelationToken: JSON
    id: ID!
    template: JSON
    json: JSON
    name: String!
    templateId: String!
    createdAt: String
    updatedAt: String
    publishedVersion: String
    publishedAt: String
  }

  type AutomationTemplateConnection {
    edges: [AutomationTemplateEdge]!
    nodes: [AutomationTemplate]!
    pageInfo: PageInfo
  }

  type AutomationTemplateEdge {
    cursor: String!
    node: AutomationTemplate!
  }

  type PublishAutomationTemplateResponse {
    publishedAt: String
    publishedVersion: String
    templateId: String!
  }

  type UpdateAliasResponse {
    alias: String
    error: JSON
    templateId: String
    updatedAt: String
  }

  type UpdateCancelationTokenResponse {
    token: JSON
    templateId: String!
    updatedAt: String!
  }

  type UpdateAutomationTemplateNameResponse {
    name: String!
    templateId: String!
    updatedAt: String!
  }

  input ScheduleItemInput {
    enabled: Boolean!
    itemId: String
    templateId: String!
    value: String!
  }

  type ScheduleItem implements Node {
    enabled: Boolean!
    id: ID!
    itemId: String!
    templateId: String!
    tenantId: String!
    value: String!
  }

  type ScheduleItemEdge {
    node: ScheduleItem!
  }

  type ScheduleItemConnection {
    edges: [ScheduleItemEdge]!
    nodes: [ScheduleItem]!
  }

  type AutomationSource implements Node {
    source: String!
    id: ID!
    templateId: String!
    tenantId: String!
    createdAt: String
    type: String!
  }

  type AutomationSourceEdge {
    node: AutomationSource!
  }

  type AutomationSourceConnection {
    edges: [AutomationSourceEdge]!
    nodes: [AutomationSource]!
  }
`;
