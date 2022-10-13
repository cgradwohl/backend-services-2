import extend from "deep-extend";
import { GraphQLDateTime } from "graphql-custom-types";
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";

import analytics from "./analytics/resolvers";
import apiKeys from "./apiKeys/resolvers";
import automationTemplates from "~/automations/studio/graphql/automation-templates/resolvers";
import automationTestEvents from "~/automations/studio/graphql/test-events/resolvers";
import brands from "./brands/resolvers";
import categories from "./categories/resolvers";
import experiments from "./experiments/resolvers";
import node from "./node/resolvers";
import preferenceSections from "~/preferences/studio/graphql/sections/resolvers";
import preferenceTemplates from "~/preferences/studio/graphql/templates/resolvers";
import preferencesPage from "~/preferences/studio/graphql/page/resolvers";
import providers from "./providers/resolvers";
import recipientUsers from "./recipient-users/resolvers";
import recipients_2022_01_28 from "./recipients-2022-01-28/resolvers";
import runs from "~/automations/studio/graphql/runs/resolvers";
import segment from "~/segment/studio/graphql/resolvers";
import sendRoutingStrategy from "./send-routing/resolvers";
import tags from "./tags/resolvers";
import templates from "./templates/resolvers";
import tenants from "./tenants/resolvers";
import users from "./users/resolvers";
import vercelIntegration from "./vercel-integration/resolvers";
import webhooks from "~/webhooks/graphQL/resolvers";

export default extend(
  {
    DateTime: GraphQLDateTime,
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  },
  analytics,
  apiKeys,
  automationTemplates,
  automationTestEvents,
  brands,
  categories,
  experiments,
  node,
  preferenceSections,
  preferencesPage,
  preferenceTemplates,
  providers,
  recipients_2022_01_28,
  recipientUsers,
  runs,
  segment,
  sendRoutingStrategy,
  sendRoutingStrategy,
  tags,
  templates,
  tenants,
  users,
  vercelIntegration,
  webhooks
);
