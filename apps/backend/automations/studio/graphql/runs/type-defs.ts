import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    runs(after: String, limit: Int, search: RunsSearchInput): RunConnection!
      @authorize(capability: "automationLogs:ListItems")
    run(runId: String!): Run @authorize(capability: "automationLogs:ReadItem")
  }

  extend type Mutation {
    cancelRun(runId: String!): String!
    invokeRun(runId: String!, request: String!): String!
  }

  type Run implements Node {
    created: DateTime! @iso8601
    steps: StepConnection
    id: ID!
    runId: String!
    type: String!
    status: String!
    source: [String]!
    context: RunContext
  }

  type RunConnection {
    edges: [RunEdge]!
    nodes: [Run]!
    pageInfo: PageInfo
  }

  type RunContext {
    brand: String
    data: JSON
    profile: JSON
    template: String
    recipient: String
  }

  type RunEdge {
    cursor: String!
    node: Run!
  }

  input RunsSearchInput {
    text: String
    startDate: String
    endDate: String
    statuses: [String]
  }

  type StepEdge {
    node: Step!
  }

  type StepConnection {
    edges: [StepEdge]!
    nodes: [Step]!
  }

  type Step implements Node {
    id: ID!
    stepId: String!
    action: String
    runId: String
    status: String
    created: DateTime @iso8601
    updated: DateTime @iso8601
    recipient: String
    template: String
    data: JSON
    context: JSON
    override: JSON
    profile: JSON
    brand: String
    list: String
    duration: String
    until: String
    delayFor: String
    delayUntil: String
    cancelation_token: String
    cancelationToken: String
    list_id: String
    recipient_id: String
    subscription: JSON
  }
`;
