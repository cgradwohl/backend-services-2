import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    automationTestEvents(templateId: String!): AutomationTestEventConnection!
    renderAutomationTemplate(template: String!, testEvent: String!): String!
  }

  extend type Mutation {
    saveAutomationTestEvent(
      templateId: String!
      testEvent: IAutomationTestEventInput
    ): SaveAutomationTestEventResponse!
    deleteAutomationTestEvent(
      templateId: String!
      testEventId: String!
    ): String!
  }

  input IAutomationTestEventInput {
    id: ID!
    testEventId: String!
    label: String
    # testEvent is a stringified JSON
    testEvent: String
    created: String
    updated: String
  }

  type AutomationTestEvent implements Node {
    id: ID!
    label: String
    # testEvent is a stringified JSON
    testEvent: String
    testEventId: String!
    created: String
    updated: String
  }

  type AutomationTestEventConnection {
    edges: [AutomationTestEventEdge]!
    nodes: [AutomationTestEvent]
  }

  type AutomationTestEventEdge {
    cusor: String!
    node: AutomationTestEvent!
  }

  type SaveAutomationTestEventResponse {
    id: ID!
    label: String
    # testEvent is a stringified JSON
    testEvent: String
    testEventId: String!
    created: String
    updated: String
  }
`;
