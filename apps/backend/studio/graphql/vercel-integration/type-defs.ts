import { gql } from "apollo-server-lambda";

export default gql`
  type VercelProject {
    id: String!
    name: String!
    enabled: Boolean!
  }

  type VercelProjectsEdge {
    node: [VercelProject!]!
  }

  type VercelProjectsConnection {
    edges: [VercelProjectsEdge!]!
    nodes: [VercelProject!]!
    pageInfo: PageInfo!
  }

  extend type Mutation {
    installVercelIntegration(
      configurationId: String!
      code: String!
      teamId: String
    ): InstallVercelIntegrationResponse!
      @authorize(capability: "apikey:ListItems")

    configureVercelIntegration(
      configurationId: String!
      projectsToEnable: [String!]!
      projectsToDisable: [String!]!
    ): ConfigureVercelIntegrationResponse!
      @authorize(capability: "apikey:ListItems")
  }

  extend type Query {
    vercelProjects(
      configurationId: String!
      after: String
      first: Int
    ): VercelProjectsConnection! @authorize(capability: "apikey:ListItems")
  }

  type InstallVercelIntegrationResponse {
    success: Boolean!
  }

  type ConfigureVercelIntegrationResponse {
    success: Boolean!
  }
`;
