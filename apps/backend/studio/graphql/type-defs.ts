import { gql } from "apollo-server-lambda";

import Analytics from "./analytics/type-defs";
import ApiKeys from "./apiKeys/type-defs";
import AutomationTemplates from "~/automations/studio/graphql/automation-templates/type-defs";
import AutomationTestEvents from "~/automations/studio/graphql/test-events/type-defs";
import Brands from "./brands/type-defs";
import Categories from "./categories/type-defs";
import Experiments from "./experiments/type-defs";
import Node from "./node/type-defs";
import PreferenceTemplates from "~/preferences/studio/graphql/templates/type-defs";
import PreferenceSections from "~/preferences/studio/graphql/sections/type-defs";
import PreferencesPage from "~/preferences/studio/graphql/page/type-defs";
import Providers from "./providers/type-defs";
import RecipientUsers from "./recipient-users/type-defs";
import Recipients_2022_01_28 from "./recipients-2022-01-28/type-defs";
import Runs from "~/automations/studio/graphql/runs/type-defs";
import SchemaDirectives from "./schema-directives/type-defs";
import Segment from "~/segment/studio/graphql/type-defs";
import SendRoutingStrategy from "./send-routing/type-defs";
import Tags from "./tags/type-defs";
import Templates from "./templates/type-defs";
import Tenants from "./tenants/type-defs";
import Users from "./users/type-defs";
import VercelIntegration from "./vercel-integration/type-defs";
import Webhooks from "~/webhooks/graphQL/type-defs";

const Base = gql`
  # custom type definitions
  scalar DateTime
  scalar JSON
  scalar JSONObject

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
  ...SchemaDirectives,
  Analytics,
  ApiKeys,
  AutomationTemplates,
  AutomationTestEvents,
  Base,
  Brands,
  Categories,
  Experiments,
  Node,
  PreferenceSections,
  PreferencesPage,
  PreferenceTemplates,
  Providers,
  Recipients_2022_01_28,
  RecipientUsers,
  Runs,
  Segment,
  SendRoutingStrategy,
  Tags,
  Templates,
  Tenants,
  Users,
  VercelIntegration,
  Webhooks,
];
