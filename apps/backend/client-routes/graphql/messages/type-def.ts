import { gql } from "apollo-server-lambda";

export default gql`
  type TrackingIds {
    archiveTrackingId: String
    clickTrackingId: String
    deliverTrackingId: String
    readTrackingId: String
    unreadTrackingId: String
  }

  enum BlockType {
    text
    action
  }

  type TextBlock {
    type: BlockType
    text: String
  }

  type ActionBlock {
    type: BlockType
    text: String
    url: String
  }

  union Block = TextBlock | ActionBlock

  type Content {
    title: String
    body: String
    blocks: [Block]
    data: JSON
    trackingIds: TrackingIds
  }

  type Messages implements Node {
    content: Content
    created: DateTime! @iso8601
    id: ID!
    locale: String
    messageId: String!
    read: Boolean
    tags: [String]
    userId: String
  }

  type MessagesEdge {
    cursor: String!
    node: Messages!
  }

  input FilterParamsInput {
    isRead: Boolean
    from: Float
    tags: [String]
  }

  input BannerParamsInput {
    from: Float
    tags: [String]
    locale: String
  }

  type MessagesConnection {
    totalCount: Int
    edges: [MessagesEdge]!
    nodes: [Messages]!
    pageInfo: PageInfo!
  }

  extend type Query {
    banners(
      limit: Int = 10
      after: String
      params: BannerParamsInput
    ): MessagesConnection! @authorize(scope: "read:messages")
    inbox(
      limit: Int = 10
      after: String
      params: FilterParamsInput
    ): MessagesConnection! @authorize(scope: "read:messages")
    messages(
      limit: Int = 10
      after: String
      params: FilterParamsInput
    ): MessagesConnection! @authorize(scope: "read:messages")
    messageCount(params: FilterParamsInput): Int!
      @authorize(scope: "read:messages")
  }

  type TrackEventResponse {
    id: ID!
  }

  type AllReadResponse {
    ids: [ID]!
  }

  extend type Mutation {
    trackEvent(trackingId: String!): TrackEventResponse!
    batchTrackEvent(eventType: String!): AllReadResponse!
  }
`;
