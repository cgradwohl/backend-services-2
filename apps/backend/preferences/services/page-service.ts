import console from "console";
import { put as publishInDynamo, query } from "~/lib/dynamo";
import getEnvironmentVariable from "~/lib/get-environment-variable";
import logger from "~/lib/logger";
import { PreferencesPage } from "~/preferences/studio/graphql/page/data-source";
import { IPreferenceSection } from "~/preferences/types";
import { preferenceTemplateService } from "./dynamo-service";
import { preferenceSectionService } from "./section-service";

const TableName = getEnvironmentVariable("PREFERENCE_TEMPLATES_TABLE");

export const preferencesPageService = (workspaceId: string) => {
  const sectionService = preferenceSectionService(workspaceId, "");
  const templateService = preferenceTemplateService(workspaceId, "");

  return {
    async publish(
      page: Omit<PreferencesPage, "id"> & { defaultBrandId: string }
    ) {
      // take snapshot of the sections, subscription grous and linked notifications with the published version
      // Maybe we should move this to a different lambda that is triggered by the publish event in dynamo db stream
      const { Items: sectionsByWorkspace } = await sectionService.list();
      // publish sections with the published version
      const sections = await Promise.all(
        sectionsByWorkspace.map(async (section: IPreferenceSection) => {
          logger.debug(
            `Publishing sections for workspace ${workspaceId}:- hp/${workspaceId}/${section.sectionId}/${page.publishedVersion}`
          );

          const [topicsBySection] = await templateService.listGroupsBySection(
            section.sectionId
          );

          const topics = topicsBySection.map((topic) => ({
            defaultStatus: topic.defaultStatus,
            templateId: topic.templateId,
            templateName: topic.templateName,
          }));

          // publish subscription topics with the published version
          return {
            section: {
              hasCustomRouting: section.hasCustomRouting,
              sectionId: section.sectionId,
              sectionName: section.name,
              routingOptions: section.routingOptions,
              topics,
            },
          };
        })
      );

      await publishInDynamo({
        TableName,
        Item: {
          pk: `hp/${workspaceId}`,
          sk: String(page.publishedVersion),
          ...page,
          sections,
        },
      });

      logger.debug(
        `successfully published preferences page ${JSON.stringify(page)}`
      );
    },

    async getPublishedPage() {
      const ExpressionAttributeValues = { ":pk": `hp/${workspaceId}` };
      const KeyConditionExpression = "pk = :pk";

      const { Items } = await query({
        ExpressionAttributeValues,
        KeyConditionExpression,
        Limit: 1,
        // descending order, get the most recent published version
        ScanIndexForward: false,
        TableName,
      });
      return Items[0] as PreferencesPage;
    },
  };
};
