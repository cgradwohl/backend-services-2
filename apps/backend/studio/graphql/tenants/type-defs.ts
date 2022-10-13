import { gql } from "apollo-server-lambda";

export default gql`
  extend type Mutation {
    setHmacEnabled(hmacEnabled: Boolean!): SetHmacEnabledResponse!
      @authorize(capability: "tenant:WriteItem")

    setShowCourierFooter(show: Boolean!): SetShowCourierFooterResponse!
      @authorize(capability: "tenant:WriteItem")

    setHideSetupProgress(hide: Boolean!): SetHideSetupProgressResponse!
      @authorize(capability: "tenant:WriteItem")

    setSetUpInfo(
      channelInterests: [String]
      stackLang: String
    ): SetSetUpInfoResponse! @authorize(capability: "tenant:WriteItem")

    setCurrentOnboardingStep(
      currentOnboardingStep: String
    ): SetCurrentOnboardingStepResponse!
      @authorize(capability: "tenant:WriteItem")

    setTenantName(name: String!): SetTenantNameResponse!
      @authorize(capability: "tenant:WriteItem")

    archiveTenant: ArchiveTenantResponse!
      @authorize(capability: "tenant:WriteItem")

    sendWorkspaceLink(
      payload: SendWorkspaceLinkInfo
    ): WorkspaceLinkSendResponse!
  }

  extend type Query {
    tenants: TenantConnection!
  }

  type ArchiveTenantResponse {
    id: ID
    success: Boolean!
  }

  type SetHmacEnabledResponse {
    id: ID
    success: Boolean!
    hmacEnabled: Boolean
  }

  input SendWorkspaceLinkInfo {
    email: String!
    loginMethodUsed: String!
    workspaceName: String!
    user_id: String!
  }

  type SetShowCourierFooterResponse {
    id: ID
    success: Boolean!
    showCourierFooter: Boolean
  }

  type SetHideSetupProgressResponse {
    id: ID
    success: Boolean!
    hideSetupProgress: Boolean
  }

  type WorkspaceLinkSendResponse {
    success: Boolean!
  }

  type SetSetUpInfoResponse {
    id: ID
    stackLang: String
    success: Boolean
  }

  type SetCurrentOnboardingStepResponse {
    id: ID
    currentOnboardingStep: String
    success: Boolean
  }

  type SetTenantNameResponse {
    id: ID
    name: String
    success: Boolean!
  }

  type CustomerRoutes {
    hmacEnabled: Boolean
  }

  type Tenant implements Node {
    apiKey: String!
    created: DateTime! @iso8601
    customerRoutes: CustomerRoutes
    currentOnboardingStep: String
    channelInterests: [String]
    hideSetupProgress: Boolean
    id: ID!
    name: String!
    showCourierFooter: Boolean
    stackLang: String
    tenantId: String!
    usage: Float!
  }

  type TenantConnection {
    edges: [TenantEdge]!
    nodes: [Tenant]!
    pageInfo: PageInfo
  }

  type TenantEdge {
    cursor: String!
    node: Tenant!
  }

  extend type Viewer {
    tenant: Tenant!
  }
`;
