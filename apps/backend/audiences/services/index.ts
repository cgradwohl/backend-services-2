import * as AudienceApiTypes from "~/audiences/api/types";
import {
  getItem,
  deleteItem,
  updateItem,
  putItem,
  StoreTypes,
} from "~/audiences/stores/dynamo";
import * as dynamoUtil from "~/audiences/util/dynamo";
import { query } from "~/lib/dynamo";
import {
  IPagination,
  paginateAcrossShards,
} from "~/lib/dynamo/paginate-across-shards";
import { getHashFromRange } from "~/lib/get-hash-from-range";

const pageSize = 100;

export type AudienceWithoutDDBKeys = Omit<
  StoreTypes.IDDBAudience,
  "pk" | "gsi1pk" | "shardId"
>;

type AudienceMembersWithoutDDBKeys = Omit<
  StoreTypes.IDDBAudienceMember,
  "pk" | "gsi1pk" | "shardId" | "workspaceId"
>;

export class AudienceService {
  workspaceId: string;
  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  async updateAudience(
    audience: Omit<AudienceApiTypes.Audience, "created_at" | "updated_at">
  ): Promise<AudienceWithoutDDBKeys> {
    const timestamp = new Date(Date.now()).toISOString();
    const shardId = getHashFromRange(dynamoUtil.PARTITION_SHARD_RANGE);

    const { gsi1pk } = dynamoUtil.createAudienceGsi1Pk(
      shardId,
      this.workspaceId
    );

    const updateExpression = [
      "SET #audienceId = :audienceId",
      "#createdAt = if_not_exists(#createdAt, :createdAt)",
      "#description = :description",
      "#filter = :filter",
      "#gsi1pk = if_not_exists(#gsi1pk, :gsi1pk)",
      "#name = :name",
      "#updatedAt = :updatedAt",
      "#version = if_not_exists(#version, :start) + :increment",
      "#workspaceId = :workspaceId",
    ].join(", ");

    const expressionAttributeNames = {
      "#audienceId": "audienceId",
      "#createdAt": "createdAt",
      "#description": "description",
      "#gsi1pk": "gsi1pk",
      "#name": "name",
      "#filter": "filter",
      "#updatedAt": "updatedAt",
      "#version": "version",
      "#workspaceId": "workspaceId",
    };

    const expressionAttributeValues = {
      ":audienceId": audience.id,
      ":createdAt": timestamp,
      ":description": audience.description ?? "",
      ":gsi1pk": gsi1pk,
      ":name": audience.name ?? "",
      ":filter": audience.filter,
      ":updatedAt": timestamp,
      ":start": 1,
      ":increment": 1,
      ":workspaceId": this.workspaceId,
    };

    const key = dynamoUtil.createAudiencePk(audience.id, this.workspaceId);

    const response = await updateItem<StoreTypes.IDDBAudience>({
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    return {
      audienceId: response.audienceId,
      createdAt: response.createdAt,
      description: response.description,
      filter: response.filter,
      // these two fields do not exist in the response just yet
      lastSendAt: response.lastSendAt,
      memberCount: response.memberCount,
      // these two fields do not exist in the response just yet
      name: response.name,
      updatedAt: response.updatedAt,
      version: response.version,
      workspaceId: response.workspaceId,
    };
  }

  async putAudienceMember(
    audienceId: string,
    memberId: string,
    reason: string, // Why this member was added
    version: number
  ) {
    const shardId = getHashFromRange(dynamoUtil.PARTITION_SHARD_RANGE);
    const { gsi1pk } = dynamoUtil.createAudienceMemberGsi1Pk(
      audienceId,
      shardId,
      version,
      this.workspaceId
    );

    const { gsi2pk } = dynamoUtil.createUserAudiencesGsi2Pk(
      shardId,
      memberId,
      this.workspaceId
    );

    const { pk } = dynamoUtil.createAudienceMemberPk(
      audienceId,
      memberId,
      version,
      this.workspaceId
    );
    const addedAt = new Date(Date.now()).toISOString();
    const materializedAudienceMember: StoreTypes.IDDBAudienceMember = {
      addedAt,
      audienceId: audienceId,
      audienceVersion: version,
      gsi1pk,
      gsi2pk,
      userId: memberId,
      pk,
      reason,
      workspaceId: this.workspaceId,
    };
    await putItem(materializedAudienceMember);

    return {
      addedAt,
    };
  }

  async deleteAudience(audience_id) {
    const { pk } = dynamoUtil.createAudiencePk(audience_id, this.workspaceId);
    await deleteItem({ pk });
  }

  async getAudience(audienceId: string): Promise<AudienceWithoutDDBKeys> {
    const response = await getItem<StoreTypes.IDDBAudience>(
      dynamoUtil.createAudiencePk(audienceId, this.workspaceId)
    );

    if (!response) {
      return null;
    }
    // removing pk and gsi1pk from response
    return {
      audienceId: response.audienceId,
      createdAt: response.createdAt,
      description: response.description,
      filter: response.filter,
      lastSendAt: response.lastSendAt,
      memberCount: response.memberCount,
      name: response.name,
      updatedAt: response.updatedAt,
      version: response.version,
      workspaceId: response.workspaceId,
    };
  }

  async getAudienceCalStatus(
    audienceId: string,
    audienceVersion: number
  ): Promise<StoreTypes.IDDBAudienceCalculation> {
    const response = await getItem<StoreTypes.IDDBAudienceCalculation>(
      dynamoUtil.createAudienceCalcStatusPk(
        audienceId,
        this.workspaceId,
        audienceVersion
      )
    );
    if (!response) {
      return null;
    }
    return response;
  }

  async getAudienceMember(
    audienceId: string,
    audienceVersion: number,
    memberId: string
  ): Promise<AudienceMembersWithoutDDBKeys> {
    const response = await getItem<StoreTypes.IDDBAudienceMember>(
      dynamoUtil.createAudienceMemberPk(
        audienceId,
        memberId,
        audienceVersion,
        this.workspaceId
      )
    );

    if (!response) {
      return null;
    }
    // removing pk and gsi1pk from response
    return {
      audienceId: response.audienceId,
      audienceVersion: response.audienceVersion,
      addedAt: response.addedAt,
      userId: response.userId,
      reason: response.reason,
    };
  }

  async deleteAudienceMember(
    audienceId: string,
    audienceVersion: number,
    memberId: string
  ): Promise<void> {
    const { pk } = dynamoUtil.createAudienceMemberPk(
      audienceId,
      memberId,
      audienceVersion,
      this.workspaceId
    );
    await deleteItem({ pk });
  }

  async listAudiences(cursor?: string): Promise<{
    items: AudienceWithoutDDBKeys[];
    paging: IPagination;
  }> {
    const retrieveItems = (currentShardId, currentLastEvaluatedKey, limit) => {
      const { gsi1pk } = dynamoUtil.createAudienceGsi1Pk(
        currentShardId,
        this.workspaceId
      );
      return query({
        ...(currentLastEvaluatedKey && {
          ExclusiveStartKey: currentLastEvaluatedKey,
        }),
        TableName: dynamoUtil.AUDIENCES_TABLE_NAME,
        IndexName: dynamoUtil.AUDIENCE_INDEX_NAME,
        KeyConditionExpression: "gsi1pk = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": gsi1pk,
        },
        Limit: limit,
      });
    };

    const response = await paginateAcrossShards<StoreTypes.IDDBAudience>(
      pageSize,
      retrieveItems,
      dynamoUtil.PARTITION_SHARD_RANGE,
      cursor
    );

    return {
      items: response.items.map<AudienceWithoutDDBKeys>((item) => ({
        audienceId: item.audienceId,
        createdAt: item.createdAt,
        description: item.description,
        filter: item.filter,
        lastSendAt: item.lastSendAt,
        memberCount: item.memberCount,
        name: item.name,
        updatedAt: item.updatedAt,
        version: item.version,
        workspaceId: item.workspaceId,
      })),
      paging: response.paging,
    };
  }

  async listAudienceMembers(
    audienceId: string,
    audienceVersion: number,
    cursor?: string,
    pageSize?: number
  ): Promise<{
    items: AudienceMembersWithoutDDBKeys[];
    paging: IPagination;
  }> {
    const retrieveItems = (currentShardId, currentLastEvaluatedKey, limit) => {
      const { gsi1pk } = dynamoUtil.createAudienceMemberGsi1Pk(
        audienceId,
        currentShardId,
        audienceVersion,
        this.workspaceId
      );

      return query({
        ...(currentLastEvaluatedKey && {
          ExclusiveStartKey: currentLastEvaluatedKey,
        }),
        TableName: dynamoUtil.AUDIENCES_TABLE_NAME,
        IndexName: dynamoUtil.AUDIENCE_INDEX_NAME,
        KeyConditionExpression: "gsi1pk = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": gsi1pk,
        },
        Limit: limit,
      });
    };

    const { items, paging } =
      await paginateAcrossShards<StoreTypes.IDDBAudienceMember>(
        pageSize,
        retrieveItems,
        dynamoUtil.PARTITION_SHARD_RANGE,
        cursor
      );

    return {
      items: items.map((member) => ({
        addedAt: member.addedAt,
        audienceId: member.audienceId,
        audienceVersion: member.audienceVersion,
        userId: member.userId,
        reason: member.reason,
      })),
      paging,
    };
  }
}
