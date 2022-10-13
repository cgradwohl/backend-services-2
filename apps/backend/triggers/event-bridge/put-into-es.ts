import { EventBridgeHandler } from "aws-lambda";
import captureException from "~/lib/capture-exception";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { encode } from "~/lib/base64";
import putRecipientIntoES, {
  es,
} from "~/lib/elastic-search/recipients/put-list-recipient";
import logger from "~/lib/logger";
import { IDynamoWriteListItem } from "~/lib/lists/types";

export interface IListItem extends IDynamoWriteListItem {
  updated: number;
  archived: boolean;
}

type Handler = EventBridgeHandler<
  string,
  { NewImage: IMessage; OldImage: IMessage },
  void
>;

export async function handle(event: {
  detail: {
    NewImage: IListItem;
    OldImage: IListItem;
    eventName: "INSERT" | "REMOVE" | "MODIFY";
  };
}): Promise<Handler> {
  const {
    detail: { NewImage, OldImage, eventName },
  } = event;

  if (
    event["detail-type"] !==
    `table.${getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME)}`
  ) {
    return;
  }

  const objtype = NewImage?.objtype ?? OldImage?.objtype;
  if (objtype !== "list") {
    return;
  }

  try {
    const id = NewImage?.id ?? OldImage.id;
    const listId = id.startsWith("list/")
      ? (id as string).split("list/").pop()
      : id;

    if (NewImage?.archived || eventName === "REMOVE") {
      const esRecipientId = encode(`${OldImage.tenantId}/${listId}`);
      logger.debug(`Deleting recipient ${esRecipientId}`);

      await es.delete(esRecipientId);
      return;
    }

    await putRecipientIntoES({
      ...NewImage,
      id: listId,
    });
  } catch (err) {
    // tslint:disable-next-line: no-console
    console.error("Elastic search deletion Failed", err);
    await captureException(err);
  }
}
