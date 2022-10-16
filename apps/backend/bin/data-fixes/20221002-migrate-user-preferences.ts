import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Handler, IDataFixEvent } from "~/bin/data-fixes/types";
import { toApiKey, toUuid } from "~/lib/api-key-uuid";
import * as dynamo from "~/lib/dynamo";
import { IProfileObject } from "~/lib/dynamo/profiles";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import logger from "~/lib/logger";
import * as notificationService from "~/lib/notification-service";
import { isCustomTierTenantId } from "~/lib/plan-pricing";
import { mapExistingUserPreferencesToV4 } from "~/preferences/lib/map-existing-user-preferences-to-v4";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { preferenceSectionService } from "~/preferences/services/section-service";
import { CourierObject } from "~/types.api";
import { INotificationJsonWire } from "~/types.api.d";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  exclusiveStartKey?: DocumentClient.Key;
}

const getSectionId = async (workspaceId: string, isCustomTier: boolean) => {
  const sectionService = preferenceSectionService(workspaceId, "default");

  if (!isCustomTier) {
    const { Items: sections } = await sectionService.list();
    if (!sections?.length) {
      return null;
    }
    const [defaultSection] = sections;
    logger.debug(
      `Found default section: ${defaultSection?.sectionId}/${defaultSection?.name}`
    );
    return defaultSection?.sectionId;
  }

  const response = await sectionService.getSectionByMetadata(
    "migrated-notifications"
  );

  if (!response?.sectionId) {
    logger.debug(
      `[workspace/${workspaceId}] Creating migrated-notifications section`
    );
    // create new section for migrated-notifications
    const section = await sectionService.saveSection({
      name: "Migrated Notifications",
      _meta: "migrated-notifications",
      routingOptions: ["direct_message", "email", "push"],
      hasCustomRouting: false,
    });
    return section.sectionId;
  }

  logger.debug(`Found migrated-notifications section: ${response?.sectionId}`);

  return response.sectionId;
};

const handler: Handler<IEvent> = async (event, context) => {
  if (process.env.KILL_PROCESS) {
    console.log("process aborted by environment varaible");
    return;
  }

  const response = await dynamo.scan({
    ExclusiveStartKey: event.exclusiveStartKey,
    FilterExpression: "attribute_exists(preferences)",
    TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
    Limit: 100,
  });

  const profiles: IProfileObject[] = response.Items as IProfileObject[];
  const lastEvaluatedKey = response.LastEvaluatedKey;

  // do the work
  for (const profile of profiles) {
    console.log("migrating profile because it has preferences", profile);
    const workspaceId = profile.tenantId;
    // putSubscription is to indicate that this is idempotent operation, to take care of multiple recipients unsub from same topic
    const { updatePreferences, update: putSubscriptionTopic } =
      preferenceTemplateService(workspaceId, "default");

    const isCustomTier = await isCustomTierTenantId(workspaceId);

    if (isCustomTier === null) {
      logger.debug(`[workspace/${workspaceId}] is is archived, aborting`);
      return;
    }

    const mappedUserPreferences = mapExistingUserPreferencesToV4(
      profile.id,
      profile.preferences
    );

    // create notification based subscription topic if unsub is from notification
    await Promise.all(
      mappedUserPreferences
        .filter((pref) => pref._meta === "migrated-notifications")
        .map(async (pref) => {
          const { get, replace: updateNotificationTemplate } =
            notificationService;
          const { updateSectionForGroup } = preferenceSectionService(
            workspaceId,
            "default"
          );

          const notification: CourierObject<INotificationJsonWire> = await get({
            tenantId: workspaceId,
            id: toUuid(pref.templateId),
          }).catch((error) => {
            logger.error(
              `Error getting notification template: ${error.message}`
            );
            return null;
          });

          if (!notification) {
            logger.debug(`Notification template not found: ${pref.templateId}`);
            return;
          }
          const sectionId = await getSectionId(workspaceId, isCustomTier);

          if (!sectionId) {
            logger.debug(`Section not found for workspace: ${workspaceId}`);
            return;
          }
          // create subscription topic with same notification id
          // @ts-ignore
          const { templateId: topicId } = await putSubscriptionTopic({
            templateId: toUuid(pref.templateId),
            templateName: `${notification.title}-topic`,
            defaultStatus: "OPTED_OUT", // default status for topic is opted out
          });

          // update section for the topicId
          await updateSectionForGroup(sectionId, toApiKey(topicId));
          // linkedNotification
          await updatePreferences({
            resourceId: toUuid(notification.id), // just to make sure it is a uuid
            resourceType: "notifications",
            templateId: toUuid(topicId),
          });
          // update notification to have subscriptionTopicId
          logger.debug(
            `Updating notification: ${
              notification.id
            }, with preference topic:- ${toApiKey(topicId)}`
          );
          await updateNotificationTemplate(
            {
              id: notification.id,
              tenantId: workspaceId,
              userId: notification.creator,
            },
            {
              ...notification,
              json: {
                ...notification.json,
                preferenceTemplateId: toApiKey(topicId),
              },
            }
          );
        })
    );

    // this updates recipient preferences for both categories and notifications
    // categories are expected to have migrated as subscription topic in https://linear.app/trycourier/issue/C-7129/backfill-to-create-a-subscription-topic-for-every-current-category
    await Promise.all(
      mappedUserPreferences.map(({ _meta, ...userPreferences }) =>
        updatePreferences(userPreferences)
      )
    );
  }

  // tail call to process more profiles in the next iteration
  if (lastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          exclusiveStartKey: lastEvaluatedKey,
        }),
      })
      .promise();
  }
};

export default handler;
