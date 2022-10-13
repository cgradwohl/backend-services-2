import { nanoid } from "nanoid";
import { toApiKey } from "~/lib/api-key-uuid";
import logger from "~/lib/logger";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { preferenceSectionService } from "~/preferences/services/section-service";
import { IPreferenceTemplate } from "~/preferences/types";

export const addDefaultsForPreferences = async (workspaceId: string) => {
  const sectionService = preferenceSectionService(workspaceId, "default");
  const subscriptionTopicService = preferenceTemplateService(
    workspaceId,
    "default"
  );
  const sectionId = nanoid();
  await sectionService.saveSection({
    sectionId,
    name: "Notifications",
    routingOptions: ["push", "email", "direct_message"],
  });
  const topics: Array<Partial<IPreferenceTemplate>> = [
    {
      templateName: "Invitations",
      defaultStatus: "OPTED_IN",
    },
    {
      templateName: "Tips and Tricks",
      defaultStatus: "OPTED_IN",
    },
    {
      templateName: "Newsletter",
      defaultStatus: "OPTED_IN",
    },
    {
      templateName: "System Updates",
      defaultStatus: "OPTED_IN",
    },
  ];

  logger.debug(
    `adding ${topics.length} default subscription topics for section, ${sectionId} `
  );

  const savedTopics = await Promise.all(
    topics.map((topic) =>
      // @ts-ignore - this is a partial template, so it's missing certain fields
      subscriptionTopicService.update(topic)
    )
  );

  await Promise.all(
    savedTopics.map((topic) =>
      sectionService.updateSectionForGroup(
        sectionId,
        toApiKey(topic.templateId)
      )
    )
  );

  logger.debug(
    `[workspace/${workspaceId}] finished creating default section ${sectionId}, and topics, ${savedTopics
      .map((t) => t.templateId)
      .join(", ")}`
  );
};
