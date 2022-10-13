import { Context } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { toApiKey, toUuid } from "~/lib/api-key-uuid";
import logger from "~/lib/logger";
import * as notificationService from "~/lib/notification-service";
import { isCustomTierTenantId } from "~/lib/plan-pricing";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { preferenceSectionService } from "~/preferences/services/section-service";
import { Handler, IDataFixEvent } from "./types";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  isCustomTier?: boolean;
  lastEvaluatedKey?: string;
  tenantId: string;
  environment: "production" | "test";
}

/*
  In order to execute this lambda, you need to execute `BinInvokeForTenants` lambda with the following payload:
  {
    "lambdaFn": "BinDataFix",
    "filename": "20220929-notification-to-topic",
  }
*/

async function fetchSectionIdByTopicId(
  isCustomTier: boolean,
  topicId: string,
  workspaceId: string
): Promise<{ sectionId: string; shouldUpdateSection: boolean }> {
  // if topicId -> old preferenceTemplateId
  // if topicId -> belongs to a section -> `migrated-preference-templates`
  // if topicId -> belogs to default section -> `default` -> there won't be any _meta for default section
  const sectionService = preferenceSectionService(workspaceId, "default");
  // This either means notification has subscription topic already
  // or notification has old preference template id (preferenceTemplate was old name for subscriptionTopic)
  // before we introduced subscriptionTopic and sections
  let sectionId = await sectionService.getSectionIdByTopicId(toApiKey(topicId));
  // if topicId has section, we don't need to update section
  const shouldUpdateSection = !sectionId;

  if (isCustomTier && !sectionId) {
    logger.debug(`No section found for topicId: ${topicId}`);
    sectionId = (
      await sectionService.saveSection({
        name: "Migrated Preference Templates",
        routingOptions: ["push", "email", "direct_message"],
        _meta: "migrated-preference-templates",
      })
    ).sectionId;
  }

  if (!(isCustomTier || sectionId)) {
    logger.debug("no section found and tenant is not on custom tier");
    const { Items: sections } = await sectionService.list();
    const [defaultSection] = sections;
    logger.debug(`Default section: ${JSON.stringify(defaultSection, null, 2)}`);
    sectionId = defaultSection.sectionId;
  }

  return { sectionId, shouldUpdateSection };
}

const handler: Handler<IEvent> = async (event, context: Context) => {
  const { tenantId: workspaceId } = event;

  if (process.env.KILL_PROCESS) {
    console.log("process aborted by environment varaible");
    return;
  }

  const { objects: notifications, lastEvaluatedKey } =
    await notificationService.list({ tenantId: workspaceId });

  if (!notifications.length) {
    logger.debug(`[workspace/${workspaceId}] no notifications found`);
    return;
  }

  logger.debug(
    `[workspace/${workspaceId}] found ${notifications.length} notifications`
  );

  const subscriptionTopicService = preferenceTemplateService(
    workspaceId,
    "default"
  );

  const isCustomTier =
    event.isCustomTier ?? (await isCustomTierTenantId(workspaceId));

  if (isCustomTier === null) {
    logger.debug(`[workspace/${workspaceId}] is is archived, aborting`);
    return;
  }

  logger.debug(`[workspace/${workspaceId}] isCustomTier: ${isCustomTier}`);

  for (const notification of notifications) {
    if (notification.json?.preferenceTemplateId) {
      logger.debug(
        `[workspace/${workspaceId}] notification has preferenceTemplateId, checking if it has sectionId`
      );

      const topicId = notification.json.preferenceTemplateId;

      const { sectionId, shouldUpdateSection } = await fetchSectionIdByTopicId(
        isCustomTier,
        topicId,
        workspaceId
      );

      if (shouldUpdateSection) {
        logger.debug(
          `[workspace/${workspaceId}] Migrating preference template, ${topicId} to subscription topic`
        );

        const { updateSectionForGroup } = preferenceSectionService(
          workspaceId,
          "default"
        );

        await updateSectionForGroup(sectionId, toApiKey(topicId));
      }

      logger.debug(
        "adding linkedNotificationId to newly created subscription topic"
      );

      await subscriptionTopicService.updatePreferences({
        resourceId: notification.id,
        resourceType: "notifications",
        templateId: toUuid(topicId),
      });
      continue;
    }

    if (notification.json?.categoryId) {
      const { categoryId, ...restOfNotificationJson } = notification.json;
      // link the notification to the subscription topic (linkedNotification++)
      logger.debug(
        `[workspace/${workspaceId}/${notification.id}] has category ${categoryId}`
      );
      // categoryId -> subscriptionTopicId -> should already be migrated in 20220928-category-to-topic
      await subscriptionTopicService.updatePreferences({
        resourceId: notification.id,
        resourceType: "notifications",
        templateId: toUuid(categoryId),
      });
      // update notification to have subscriptionTopicId

      await notificationService.replace(
        {
          id: notification.id,
          tenantId: workspaceId,
          userId: notification.creator,
        },
        {
          ...notification,
          json: {
            ...restOfNotificationJson,
            preferenceTemplateId: toApiKey(notification.json?.categoryId),
          },
        }
      );
    }
  }

  // Tail recursion
  if (lastEvaluatedKey) {
    logger.debug(`Invoking next batch for tenant ${workspaceId}`);
    const { functionName } = context;
    await lambda.invoke({
      FunctionName: functionName,
      InvocationType: "Event",
      Payload: JSON.stringify({
        tenantId: workspaceId,
        lastEvaluatedKey,
      }),
    });
  }
};

export default handler;
