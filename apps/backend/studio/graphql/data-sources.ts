import AutomationTemplatesDataSource from "~/automations/studio/graphql/automation-templates/data-source";
import RunsDataSource from "~/automations/studio/graphql/runs/data-sources/runs";
import AutomationTestEventsDataSource from "~/automations/studio/graphql/test-events/data-source";
import PreferenceTemplatesDataSource from "~/preferences/studio/graphql/templates/data-source";
import PreferenceSectionDataSource from "~/preferences/studio/graphql/sections/data-source";
import PreferencesPageDataSource from "~/preferences/studio/graphql/page/data-source";
import SegmentDataSource from "~/segment/studio/graphql/data-source";
import WebhooksDataSource from "~/webhooks/graphQL/data-source";
import AnalyticsDataSource from "./analytics/data-source";
import ApiKeysDataSource from "./apiKeys/data-source";
import BrandsDataSource from "./brands/data-source";
import CategoriesDataSource from "./categories/data-source";
import RecipientUsersDataSource from "./recipient-users/data-source";
import Recipient2022_01_28_DataSource from "./recipients-2022-01-28/data-source";
import SendRoutingStrategyDataSource from "./send-routing/data-source";
import TagsDataSource from "./tags/data-source";
import TemplatesDataSource from "./templates/data-source";
import TenantsDataSource from "./tenants/data-source";
import UsersDataSource from "./users/data-source";
import VercelIntegrationDataSource from "./vercel-integration/data-source";

export default () => {
  return {
    analytics: new AnalyticsDataSource(),
    apiKeys: new ApiKeysDataSource(),
    automationTemplates: new AutomationTemplatesDataSource(),
    automationTestEvents: new AutomationTestEventsDataSource(),
    brands: new BrandsDataSource(),
    categories: new CategoriesDataSource(),
    preferenceSectionDataSource: new PreferenceSectionDataSource(),
    preferencesPageDataSource: new PreferencesPageDataSource(),
    preferenceTemplates: new PreferenceTemplatesDataSource(),
    recipients_2022_01_28: new Recipient2022_01_28_DataSource(),
    recipientUsers: new RecipientUsersDataSource(),
    runs: new RunsDataSource(),
    segment: new SegmentDataSource(),
    sendRoutingStrategy: new SendRoutingStrategyDataSource(),
    tags: new TagsDataSource(),
    templates: new TemplatesDataSource(),
    tenants: new TenantsDataSource(),
    users: new UsersDataSource(),
    vercelIntegration: new VercelIntegrationDataSource(),
    webhooks: new WebhooksDataSource(),
  };
};
