import { gql } from "apollo-server-lambda";

export const Preferences = gql`
  extend type Query {
    recipientPreferences: RecipientPreferenceConnection!
  }

  scalar Void

  extend type Mutation {
    updatePreferences(templateId: String!, preferences: PreferencesInput!): Void
  }

  enum Status {
    OPTED_IN
    OPTED_OUT
    REQUIRED
  }

  input SnoozeInput {
    start: DateTime
    until: DateTime
  }

  enum Channel {
    direct_message
    email
    push
  }

  input PreferencesInput {
    channel_preferences: [Channel]
    hasCustomRouting: Boolean
    routingPreferences: [Channel]
    snooze: SnoozeInput
    status: Status!
  }

  type Snooze {
    start: DateTime
    until: DateTime!
  }

  type Preference {
    status: Status!
    snooze: Snooze
    channel_preferences: [Channel]
  }

  type PreferenceTemplate implements Node {
    defaultStatus: Status!
    id: ID!
    templateId: String!
    templateName: String!
  }

  type RecipientPreference {
    templateId: String!
    status: Status
    hasCustomRouting: Boolean
    routingPreferences: [Channel]
  }

  type RecipientPreferenceConnection {
    edges: [RecipientPreferenceEdge]!
    nodes: [RecipientPreference]!
    pageInfo: PageInfo
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

  type RecipientPreferenceEdge {
    cursor: String!
    node: RecipientPreference!
  }

  extend type Brand {
    preferenceTemplates: PreferenceTemplateConnection
  }

  extend type PreferenceSection {
    preferenceGroups: PreferenceTemplateConnection
    topics: PreferenceTemplateConnection
  }
`;
