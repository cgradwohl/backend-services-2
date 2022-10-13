import { gql } from "apollo-server-lambda";

import { recipientMappingDefaultValues_2022_01_28 as userRecipientFieldMappings } from "~/lib/sample-recipient-fields";

const getRecipientFieldType = (fieldType) =>
  Object.keys(userRecipientFieldMappings)
    .map((key) => {
      switch (key) {
        case "email_verified":
        case "phone_number_verified":
          return `${key}: Boolean`;
        case "updated_at":
          return `${key}: Int`;
        case "address":
          return `address: ${fieldType}`;
        default:
          return `${key}: String`;
      }
    })
    .join("\n");

export default gql`
input SortBy {
  id: String!
  desc: Boolean!
}

input LastEvaluatedKeyInput {
  id: String!
  tenantId: String!
}

type LastEvaluatedKey {
  id: String!
  tenantId: String!
}

input RecipientSearchInput_2022_01_28 {
  filterTypes: [String]
  sortBy: SortBy
  text: String
}

type ProfileField {
  key: String!
  value: JSON
}

input AddressInput_2022_01_28 {
  country: String
  formatted: String
  locality: String
  postal_code: String
  region: String
  street_address: String
}

type AddressResponse_2022_01_28 {
  country: String
  formatted: String
  locality: String
  postal_code: String
  region: String
  street_address: String
}

type Profile {
  fields: [ProfileField]!
}

type Recipient_2022_01_28 implements Node {
  id: ID!
  last_sent_at: DateTime @iso8601
  name: String
  email: String
  phone_number: String
  profile: Profile!
  recipientId: String!
  type: String!
  updated_at: DateTime! @iso8601
}

type ListRecipient {
  count: Int
  id: ID!
  last_sent_at: DateTime @iso8601
  name: String
  email: String
  phone_number: String
  recipientId: String!
  type: String!
  updated_at: DateTime! @iso8601
}

type ListRecipientUser {
  id: ID!
  name: String
  email: String
  phone_number: String
  recipientId: String!
  updated_at: DateTime @iso8601
}

input CourierProfile {
  channel: String
}

type ListRecipientUsers {
  userRecipients: [ListRecipientUser]
  after: LastEvaluatedKey
}

type UserToAddToList {
  id: ID!
  name: String
  recipientId: String!
  alreadyInList: Boolean!
}

type UsersToAddToList {
  users: [UserToAddToList]
}

type RecipientEdge_2022_01_28 {
  cursor: String!
  node: Recipient_2022_01_28!
}

type RecipientConnection_2022_01_28 {
  edges: [RecipientEdge_2022_01_28]!
  nodes: [Recipient_2022_01_28]!
  pageInfo: PageInfo
}

type SaveUserRecipientResponse {
  recipientId: String!
  ${getRecipientFieldType("AddressResponse_2022_01_28")}
}

type DeleteUserStatus {
  status: Boolean!
}

extend type Mutation {
  saveUserRecipient(
    recipientId: String!
    userRecipientInputData: JSONObject!
  ): SaveUserRecipientResponse!

  addUsersToList(
    listId: String!
    users: [String!]!
  ): ListRecipientUsers!

  deleteUserRecipient(
    recipientId: String!
  ): DeleteUserStatus!
}

extend type Query {
  recipient_2022_01_28(recipientId: String!): Recipient_2022_01_28 @authorize(capability: "recipient:ReadItem")

  listRecipient(listRecipientId: String!): ListRecipient @authorize(capability: "recipient:ReadItem")

  listRecipientUsers(
    listRecipientId: String!
    after: LastEvaluatedKeyInput
  ): ListRecipientUsers! @authorize(capability: "recipient:ReadItem")

  listUsers(listRecipientId: String!): ListRecipientUsers! @authorize(capability: "recipient:ReadItem")

  recipients_2022_01_28(
    after: String
    first: Int
    search: RecipientSearchInput_2022_01_28
  ): RecipientConnection_2022_01_28! @authorize(capability: "recipient:ListItems")

  usersToAddToList(
    searchTerm: String!
    listId: String!
    ): UsersToAddToList! @authorize(capability: "recipient:ListItems")
}
`;
