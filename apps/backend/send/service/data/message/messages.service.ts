import { nanoid } from "nanoid";
import { RequestV2 } from "~/api/send/types";
import { Message, IMessageItem } from "./message.entity";
import { store, TableName } from "../lib/data-store";
import { getItem, put } from "~/lib/dynamo";
import { generateFilePath } from "../lib/generate-file-path";
import { SendDataEntity } from "../types";

export default (workspaceId: string) => {
  type MessageCreateItem = Omit<
    IMessageItem,
    "created" | "filePath" | "messageId" | "updated" | "workspaceId"
  > & { message: RequestV2["message"] };

  return {
    create: async (item: MessageCreateItem) => {
      const messageId = nanoid();
      // write to s3
      const filePath = generateFilePath({
        id: messageId,
        name: SendDataEntity.message,
      });
      await store.put(filePath, item.message);

      // write to dynamo
      const message = new Message({
        ...item,
        filePath,
        messageId,
        workspaceId,
      });

      await put({
        Item: message.toItem(),
        TableName,
      });

      return message;
    },
  };
};
