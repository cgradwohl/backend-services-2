import { gql } from "apollo-server-lambda";

export default gql`
  interface IUser {
    email: String!
    emailVerified: Boolean!
    id: ID!
    "provider the user signed up with: email, google, etc."
    provider: String!
  }

  extend type Mutation {
    setRole(userId: String!, role: String!): SetRoleResponse!
      @authorize(capability: "user:WriteItem")
    updateUserDetails(
      userId: String!
      marketingRole: String
      firstName: String
      lastName: String
    ): updateUserResponse
  }

  type Policy {
    statements: [PolicyStatement]!
    version: String!
  }

  type PolicyStatement {
    actions: [String]!
    effect: PolicyStatmentEffect!
    resources: [String]!
  }

  enum PolicyStatmentEffect {
    ALLOW
    DENY
  }

  extend type Query {
    user(userId: String!): User!
    viewer: Viewer!
  }

  type Role {
    label: String
    key: String!
    policies: [Policy]!
  }

  type SetRoleResponse {
    role: String
    success: Boolean
  }

  type updateUserResponse {
    userId: String!
    success: Boolean
  }

  type User implements IUser & Node {
    email: String!
    emailVerified: Boolean!
    id: ID!
    "provider the user signed up with: email, google, etc."
    provider: String!
    role: String!
    userId: String!
    firstName: String
    lastName: String
  }

  type Viewer implements IUser {
    email: String!
    emailVerified: Boolean!
    id: ID!
    "provider the user signed up with: email, google, etc."
    provider: String!
    role: Role!
    signature: String!
    uservoiceToken: String
    userId: String!
  }
`;
