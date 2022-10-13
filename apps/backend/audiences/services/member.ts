import { StoreTypes } from "~/audiences/stores/dynamo";
import * as dynamoUtil from "~/audiences/util/dynamo";
import { query } from "~/lib/dynamo";
import {
  IPagination,
  paginateAcrossShards,
} from "~/lib/dynamo/paginate-across-shards";

const pageSize = 100;

export class MemberService {
  workspaceId: string;
  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  async listAudiencesByMemberId(
    userId: string,
    cursor?: string
  ): Promise<{
    items: Array<
      Pick<StoreTypes.IDDBAudienceMember, "audienceId" | "audienceVersion">
    >;
    paging: IPagination;
  }> {
    const retrieveItems = (currentShardId, currentLastEvaluatedKey, limit) => {
      const { gsi2pk } = dynamoUtil.createUserAudiencesGsi2Pk(
        currentShardId,
        userId,
        this.workspaceId
      );

      return query({
        ...(currentLastEvaluatedKey && {
          ExclusiveStartKey: currentLastEvaluatedKey,
        }),
        TableName: dynamoUtil.AUDIENCES_TABLE_NAME,
        IndexName: dynamoUtil.MEMBER_INDEX_NAME,
        KeyConditionExpression: "gsi2pk = :gsi2pk",
        ExpressionAttributeValues: {
          ":gsi2pk": gsi2pk,
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
      items: items.map(({ audienceId, audienceVersion }) => ({
        audienceId,
        audienceVersion,
      })),
      paging,
    };
  }
}
