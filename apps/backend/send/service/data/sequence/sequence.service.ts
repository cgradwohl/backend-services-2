import { store, TableName } from "../lib/data-store";
import { generateFilePath } from "../lib/generate-file-path";
import { getItem, put } from "~/lib/dynamo";
import { SendDataEntity } from "../types";
import { nanoid } from "nanoid";
import { SequenceCreateItem, SequencePayload } from "./sequence.types";
import { Sequence } from "./sequence.entity";

export default (workspaceId: string) => {
  return {
    create: async (item: SequenceCreateItem) => {
      const sequenceId = nanoid();

      // write to s3
      const filePath = generateFilePath({
        id: sequenceId,
        name: SendDataEntity.sequence,
      });
      await store.put(filePath, item);

      // write to dynamo
      const sequence = new Sequence({
        ...item,
        filePath,
        sequenceId,
        workspaceId,
      });
      await put({
        Item: sequence.toItem(),
        TableName,
      });

      return sequence;
    },

    getPayload: async (params: {
      requestId: string;
      sequenceId: string;
    }): Promise<SequencePayload | undefined> => {
      const { requestId, sequenceId } = params;

      const { pk, sk } = Sequence.key({ requestId, sequenceId });
      // get dynamo
      const { Item } = await getItem({
        Key: {
          pk,
          sk,
        },
        TableName,
      });

      if (!Item) {
        return undefined;
      }

      const sequence = Sequence.fromItem(Item);

      // get s3
      const payload = (await store.get(
        sequence.filePath
      )) as SequenceCreateItem;

      return {
        ...sequence.toItem(),
        payload: payload.sequence,
      };
    },
  };
};
