import { gql } from "apollo-server-lambda";

export default gql`
  extend type Query {
    segment: SegmentConnection!
  }

  type Segment implements Node {
    id: ID!
    eventId: String!
    automationTemplateMappings: JSON
    lastReceivedAt: String!
    segmentEvent: JSON
  }

  type SegmentConnection {
    edges: [SegmentEdge]!
    nodes: [Segment]!
    pageInfo: PageInfo
  }

  type SegmentEdge {
    cursor: String!
    node: Segment!
  }
`;
