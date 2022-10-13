import { store, TableName } from "../lib/data-store";
import { generateFilePath } from "../lib/generate-file-path";
import { put, query } from "~/lib/dynamo";
import { SendDataEntity } from "../types";
import { nanoid } from "nanoid";
import { SendSequenceAction } from "~/api/send/types";
import {
  SequenceActionCreateItem,
  SequenceActionPayload,
} from "./sequence-action.types";
import { SequenceAction } from "./sequence-action.entity";

export default (workspaceId: string) => {
  return {
    create: async ({
      requestId,
      sequence,
      sequenceId,
      triggerId,
    }: SequenceActionCreateItem) => {
      const idMap = sequence.map((obj) => ({
        ...obj,
        sequenceActionId: nanoid(),
      }));

      const sequenceActions = await Promise.all(
        idMap.map(async ({ sequenceActionId, ...restAction }, index) => {
          // write to s3
          const filePath = generateFilePath({
            id: sequenceActionId,
            name: SendDataEntity.sequenceAction,
          });
          await store.put(filePath, restAction);

          // write dynamo
          const sequenceAction = new SequenceAction({
            filePath,
            nextSequenceActionId: idMap[index + 1]?.sequenceActionId ?? null,
            prevSequenceActionId: idMap[index - 1]?.sequenceActionId ?? null,
            requestId,
            sequenceId,
            sequenceActionId,
            triggerId,
            workspaceId,
          });

          await put({
            Item: sequenceAction.toItem(),
            TableName,
          });

          return sequenceAction;
        })
      );

      return sequenceActions;
    },

    getPayloadById: async (
      sequenceActionId: string
    ): Promise<SequenceActionPayload | undefined> => {
      const { gsi2pk } = SequenceAction.key({
        requestId: undefined,
        sequenceId: undefined,
        sequenceActionId,
      });

      // get dynamo
      const {
        Items: [Item],
      } = await query({
        ExpressionAttributeValues: {
          ":gsi2pk": gsi2pk,
        },
        KeyConditionExpression: "gsi2pk = :gsi2pk",
        Limit: 1,
        IndexName: "gsi2",
        TableName,
      });

      if (!Item) {
        return undefined;
      }

      const sequenceAction = SequenceAction.fromItem(Item);

      // get s3
      const payload = (await store.get(
        sequenceAction.filePath
      )) as SendSequenceAction;

      return {
        ...sequenceAction,
        ...payload,
      };
    },
  };
};
