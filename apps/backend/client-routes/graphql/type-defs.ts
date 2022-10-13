import { gql } from "apollo-server-lambda";
import Node from "~/studio/graphql/node/type-defs";
import Brands from "./brands/type-def";
import Messages from "./messages/type-def";
import { PreferencePage } from "./preferences/page/type-defs";
import { PreferenceSections } from "./preferences/sections/type-defs";
import { Preferences } from "./preferences/templates/type-defs";
import SchemaDirectives from "./schema-directives/type-defs";

const Base = gql`
  # custom type definitions
  scalar DateTime
  scalar JSON

  # baseline objects
  type Mutation
  type Query

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }
`;

export default [
  Brands,
  Messages,
  Preferences,
  PreferenceSections,
  PreferencePage,
  Base,
  Node,
  ...SchemaDirectives,
];
