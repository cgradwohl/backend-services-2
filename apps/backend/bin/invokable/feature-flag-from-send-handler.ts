import { FlagName } from "~/lib/api-feature-service";
import chunkArray from "~/lib/chunk-array";
import { batchWrite } from "~/lib/dynamo";

interface IEvent {
  workspaceIds: string[];
  flagName: FlagName;
  variation: boolean;
}
export const acceptableFeatureNames = [
  "route_to_v2",
  "use_materialized_brands",
  "METER", // This is temporary
  "block_translate_and_delivery",
  "DELIVERY_METER",
] as const;

export const handle = async (event: IEvent) => {
  const workspaceIds = event.workspaceIds ?? [];
  const flagName = event.flagName;
  const variation = event.variation;
  if (!process.env.FEATURE_TOGGLE_TABLE) {
    throw new Error("FEATURE_TOGGLE_TABLE is not set as environment variable");
  }

  if (!workspaceIds.length) {
    throw new Error("specify atleast some workspaces");
  }

  if (!flagName) {
    throw new Error("specify a flag name");
  }

  if (!acceptableFeatureNames.includes(flagName)) {
    throw new Error(`invalid ${flagName} flagName`);
  }
  const batches = chunkArray(workspaceIds, 25);

  const tableName = process.env.FEATURE_TOGGLE_TABLE;

  return Promise.all(
    batches.map(async (batch) => {
      await batchWrite({
        RequestItems: {
          [tableName]: batch.map((workspaceId) => ({
            PutRequest: {
              Item: {
                pk: `${workspaceId}/${flagName}`,
                variation,
                created: Date.now(),
              },
            },
          })),
        },
      });
    })
  );
};
