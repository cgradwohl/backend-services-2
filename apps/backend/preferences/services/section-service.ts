import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { nanoid } from "nanoid";
import { deleteItem, getItem, put, query, update } from "~/lib/dynamo";
import { IPreferenceSectionDataInput } from "~/preferences/types";
const TableName = process.env.PREFERENCE_TEMPLATES_TABLE;

async function removeExistingSections(
  tenantId: string,
  preferenceGroupId: string
) {
  const response = await query({
    ExpressionAttributeNames: {
      "#gsi1pk": "gsi1pk",
    },
    ExpressionAttributeValues: {
      ":gsi1pk": `g/${tenantId}/${preferenceGroupId}`,
    },
    KeyConditionExpression: "#gsi1pk = :gsi1pk",
    IndexName: "by-preference-id",
    TableName,
  });
  if (response.Items.length > 0) {
    const [{ pk, sk }] = response.Items;
    await deleteItem({
      Key: {
        pk,
        sk,
      },
      TableName,
    });
  }
}

export const preferenceSectionService = (tenantId: string, userId: string) => {
  return {
    async saveSection(section: IPreferenceSectionDataInput) {
      const date = new Date().toISOString();
      const sectionId = section.sectionId ?? nanoid();

      const updateExpressions = [
        "#sectionId = if_not_exists(sectionId, :sectionId)",
        "#created = if_not_exists(created, :created)",
        "#creatorId = if_not_exists(creatorId, :creatorId)",
        "#hasCustomRouting = :hasCustomRouting",
        "#updated = :updated",
        "#updaterId = :updaterId",
        "#routingOptions = :routingOptions",
        "#gsi2pk = :gsi2pk",
        "#name = :name",
        section._meta ? "#_meta = :_meta" : "",
        section.publishedVersion ? "#publishedVersion = :publishedVersion" : "",
      ].filter(Boolean);

      const updates = {
        ...section,
        sectionId: sectionId,
        updated: date,
        updaterId: userId,
        created: date,
        creatorId: userId,
      };

      const ExpressionAttributeNames = {
        "#created": "created",
        "#creatorId": "creatorId",
        "#gsi2pk": "gsi2pk",
        "#hasCustomRouting": "hasCustomRouting",
        "#name": "name",
        "#routingOptions": "routingOptions",
        "#sectionId": "sectionId",
        "#updated": "updated",
        "#updaterId": "updaterId",
        ...(updates.publishedVersion && {
          "#publishedVersion": "publishedVersion",
        }),
        ...(updates._meta && {
          "#_meta": "_meta",
        }),
      };

      const ExpressionAttributeValues = {
        ":created": "created",
        ":creatorId": "creatorId",
        ":gsi2pk": `s/${tenantId}`,
        ":hasCustomRouting": updates?.hasCustomRouting ?? false,
        ":name": updates.name,
        ":routingOptions": updates.routingOptions ?? [],
        ":sectionId": sectionId,
        ":updated": updates.updated,
        ":updaterId": updates.updaterId,
        ...(updates.publishedVersion && {
          ":publishedVersion": updates.publishedVersion,
        }),
        ...(updates._meta && {
          ":_meta": updates._meta,
        }),
      };

      const Key = {
        pk: `s/${tenantId}/${sectionId}`,
        sk: `s/${tenantId}`,
      };

      const UpdateExpression = `SET ${updateExpressions.join(", ")}`;

      await update({
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        Key,
        TableName,
        UpdateExpression,
      });

      return updates;
    },

    async deleteSection(sectionId: string) {
      await update({
        Key: {
          pk: `s/${tenantId}/${sectionId}`,
          sk: `s/${tenantId}`,
        },
        TableName,
        UpdateExpression:
          "SET #isArchived = :isArchived, #archivedAt = :archivedAt, #archivedBy = :archivedBy",
        ExpressionAttributeValues: {
          ":isArchived": true,
          ":archivedAt": new Date().toISOString(),
          ":archivedBy": userId,
        },
        ExpressionAttributeNames: {
          "#isArchived": "isArchived",
          "#archivedAt": "archivedAt",
          "#archivedBy": "archivedBy",
        },
      });
    },

    async updateSectionForGroup(sectionId: string, preferenceGroupId: string) {
      const date = new Date().toISOString();

      const Item = {
        created: date,
        creatorId: userId ?? "",
        sectionId,
        updated: date,
        updaterId: userId,
        preferenceGroupId,
      };

      await removeExistingSections(tenantId, preferenceGroupId);
      // update group with sectionId and preferenceGroupId
      await put({
        Item: {
          ...Item,
          // access pattern to support retriving section by groupId
          gsi1pk: `g/${tenantId}/${preferenceGroupId}`,
          gsi1sk: `g/${tenantId}`,
          gsi2pk: `s_pg/${tenantId}/${sectionId}`,
          pk: `s_pg/${tenantId}/${sectionId}/${preferenceGroupId}`,
          sk: `s/${tenantId}`,
        },
        TableName,
      });

      return Item;
    },

    async get(sectionId) {
      return (
        await getItem({
          TableName,
          Key: {
            pk: `s/${tenantId}/${sectionId}`,
            sk: `s/${tenantId}`,
          },
        })
      ).Item;
    },

    async getSectionByMetadata(metadata: IPreferenceSectionDataInput["_meta"]) {
      const response = await query({
        ExpressionAttributeNames: {
          "#gsi2pk": "gsi2pk",
          "#_meta": "_meta",
        },
        ExpressionAttributeValues: {
          ":gsi2pk": `s/${tenantId}`,
          ":_meta": metadata,
        },
        IndexName: "gsi2",
        KeyConditionExpression: "#gsi2pk = :gsi2pk",
        FilterExpression: "#_meta = :_meta",
        Limit: 1,
        TableName,
      });

      return response?.Items[0];
    },

    async getSectionIdByTopicId(topicId: string): Promise<string> {
      const response = await query({
        ExpressionAttributeNames: {
          "#gsi1pk": "gsi1pk",
        },
        ExpressionAttributeValues: {
          ":gsi1pk": `g/${tenantId}/${topicId}`,
        },
        KeyConditionExpression: "#gsi1pk = :gsi1pk",
        IndexName: "by-preference-id",
        TableName,
      });
      if (!response.Items.length) {
        return null;
      }
      const [{ sectionId }] = response.Items;
      return sectionId;
    },

    list(): Promise<DocumentClient.QueryOutput> {
      return query({
        ExpressionAttributeNames: {
          "#gsi2pk": "gsi2pk",
          "#isArchived": "isArchived",
        },
        ExpressionAttributeValues: {
          ":gsi2pk": `s/${tenantId}`,
          ":isArchived": false,
        },
        KeyConditionExpression: "#gsi2pk = :gsi2pk",
        FilterExpression:
          "attribute_not_exists(#isArchived) OR #isArchived = :isArchived",
        IndexName: "gsi2",
        TableName,
      });
    },
  };
};
