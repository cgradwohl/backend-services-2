import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { toUuid } from "~/lib/api-key-uuid";
import { getItem, id as dynamoId, put, query, update } from "~/lib/dynamo";
import getEnvVar from "~/lib/get-environment-variable";
import getTenantInfo from "~/lib/get-tenant-info";
import {
  IPreferenceAttachmentResponse,
  IPreferenceTemplate,
  IPreferenceTemplateAttachment,
  ResourceType,
} from "~/preferences/types";
export const objType = "preference-template";

const getTemplateDynamoKey = (
  tenantId: string,
  resourceType: ResourceType,
  resourceId: string
) => ({
  pk: tenantId,
  sk: `${resourceType}#${resourceId}`,
});

export const preferenceTemplateService = (tenantId: string, userId: string) => {
  return {
    async get<T>(resourceType: ResourceType, resourceId: string): Promise<T> {
      const response = await getItem({
        Key: getTemplateDynamoKey(tenantId, resourceType, resourceId),
        TableName: process.env.PREFERENCE_TEMPLATES_TABLE,
      });
      return response.Item as T;
    },

    async update(
      updatedTemplate: IPreferenceTemplate,
      isCopying = false
    ): Promise<IPreferenceTemplate> {
      const date = new Date().toISOString();
      const templateId = updatedTemplate.templateId ?? dynamoId();
      const isArchived = updatedTemplate.isArchived ?? false;
      // This is to toggle the enviornments if we are copying (only true when we have env variable) the template
      // from test env to prod or the othre way around
      const { environment, tenantId: id } = getTenantInfo(tenantId);
      let pk;

      if (isCopying) {
        // environment == test means we want to copy this to production, if not test, means copy it to test
        pk = environment === "test" ? id : `${id}/test`;
      } else {
        pk = tenantId;
      }

      const updateExpressions = [
        "allowedPreferences = :allowedPreferences",
        "created = if_not_exists(created, :created)",
        "creatorId = if_not_exists(creatorId, :creatorId)",
        "defaultStatus = :defaultStatus",
        "templateId = if_not_exists(templateId, :templateId)",
        "templateName = :templateName",
        "updated = :updated",
        "updaterId = :updaterId",
        "routingOptions = :routingOptions",
        "isArchived = :isArchived",
        updatedTemplate.publishedVersion
          ? "publishedVersion = :publishedVersion"
          : "",
      ].filter(Boolean);

      const updates = {
        templateId,
        ...updatedTemplate,
        created: date,
        creatorId: userId,
        isArchived,
        updated: date,
        updaterId: userId,
      };

      await update({
        ExpressionAttributeValues: {
          ":allowedPreferences": updates.allowedPreferences ?? [],
          ":created": updates.created,
          ":creatorId": updates.creatorId,
          ":defaultStatus": updates.defaultStatus,
          ":isArchived": updates.isArchived,
          ":templateId": updates.templateId,
          ":templateName": updates.templateName,
          ":updated": updates.updated,
          ":updaterId": updates.updaterId,
          ":routingOptions": updates.routingOptions ?? [],
          ...(updates.publishedVersion && {
            ":publishedVersion": updates.publishedVersion,
          }),
        },
        Key: getTemplateDynamoKey(pk, "templates", templateId),
        TableName: process.env.PREFERENCE_TEMPLATES_TABLE,
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      });

      return updates;
    },

    async updatePreferences({
      publishedVersion = "",
      resourceId,
      resourceType,
      templateId,
      value,
    }: IPreferenceTemplateAttachment): Promise<IPreferenceAttachmentResponse> {
      const updateDetails = {
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: userId,
        resourceId,
        resourceType,
        value,
        ...(publishedVersion && { publishedVersion }),
      };

      const sortKey =
        // notification is the only resource that would be 1:1 relation with preference template
        // other resources like recipient will have many preferences
        resourceType === "notifications"
          ? resourceId
          : `${resourceId}#${templateId}`;

      const { pk, sk } = getTemplateDynamoKey(tenantId, resourceType, sortKey);

      await put({
        Item: {
          pk,
          sk,
          // Check if we have valid templateId, otherwise no need to update the index
          ...(templateId
            ? {
                gsi1pk: pk,
                gsi1sk: `templates#${templateId}#${resourceType}#${resourceId}`,
              }
            : {}),
          ...updateDetails,
        },
        TableName: process.env.PREFERENCE_TEMPLATES_TABLE,
      });

      return updateDetails;
    },

    list(
      resourceType: ResourceType = "templates",
      resourceId = "",
      useSecondaryIndex = false
    ) {
      let params: Partial<DocumentClient.QueryInput>;

      if (useSecondaryIndex) {
        params = {
          ExpressionAttributeNames: {
            "#gsi1pk": "gsi1pk",
            "#gsi1sk": "gsi1sk",
            "#isArchived": "isArchived",
          },
          ExpressionAttributeValues: {
            ":gsi1pk": tenantId,
            ":gsi1sk": `templates#${resourceId}#${resourceType}`,
            ":isArchived": false,
          },
          IndexName: "by-preference-id",
          KeyConditionExpression:
            "#gsi1pk = :gsi1pk AND begins_with(#gsi1sk, :gsi1sk)",
        };
      } else {
        params = {
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#sk": "sk",
            "#isArchived": "isArchived",
          },
          ExpressionAttributeValues: {
            ":pk": tenantId,
            ":sk": `${resourceType}#${resourceId}`,
            ":isArchived": false,
          },
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
        };
      }

      return query({
        TableName: process.env.PREFERENCE_TEMPLATES_TABLE,
        ...params,
        FilterExpression:
          "attribute_not_exists(#isArchived) OR #isArchived = :isArchived",
      });
    },

    async listGroupsBySection(sectionId: string) {
      const response = await query({
        ExpressionAttributeNames: {
          "#gsi2pk": "gsi2pk",
        },
        ExpressionAttributeValues: {
          ":gsi2pk": `s_pg/${tenantId}/${sectionId}`,
        },
        KeyConditionExpression: "#gsi2pk = :gsi2pk",
        IndexName: "gsi2",
        TableName: getEnvVar("PREFERENCE_TEMPLATES_TABLE"),
      });

      const groups = (
        await Promise.all(
          response.Items.map(async (item) => {
            const [{ Item }, linkedNotificationsResponse] = await Promise.all([
              getItem({
                Key: {
                  pk: tenantId,
                  sk: `templates#${toUuid(item.preferenceGroupId)}`,
                },
                TableName: process.env.PREFERENCE_TEMPLATES_TABLE,
              }),
              this.list("notifications", toUuid(item.preferenceGroupId), true),
            ]);

            if (Item?.isArchived || !Item?.templateId) {
              return null;
            }

            return {
              ...Item,
              linkedNotifications: linkedNotificationsResponse?.Count ?? 0,
            };
          })
        )
      ).filter(Boolean);

      return [groups, response.LastEvaluatedKey];
    },
  };
};
