import { Request } from "./request.entity";
import { store, TableName } from "../lib/data-store";
import { generateFilePath } from "../lib/generate-file-path";
import { getItem, put } from "~/lib/dynamo";
import { RequestCreateItem, RequestPayload } from "./request.types";
import { SendDataEntity } from "../types";
import {
  InvalidArgumentSendError,
  NotFoundSendError,
  UnavailableSendError,
  UnknownSendError,
} from "~/send/errors";
import { NotFound } from "~/lib/http-errors";
import { ArgumentRequiredError } from "../errors";

const getDynamoItem = async (
  pk: `request/${string}`,
  sk: `request/${string}`
) => {
  try {
    const { Item } = await getItem({
      Key: {
        pk,
        sk,
      },
      TableName,
    });

    if (!Item) {
      throw new NotFoundSendError(
        `Request entity not found in Dynamo. pk: ${pk}, sk: ${sk}`
      );
    }

    return Item;
  } catch (error) {
    throw new UnavailableSendError(error);
  }
};

const getS3Object = async (filePath: string) => {
  try {
    const payload = (await store.get(filePath)) as RequestCreateItem;

    return payload;
  } catch (error) {
    if (error instanceof NotFound) {
      throw new NotFoundSendError(
        `Request entity not found in S3:SendDataBucket. filePath: ${filePath}`
      );
    }

    throw new UnavailableSendError(error);
  }
};

export default (workspaceId: string) => {
  return {
    create: async (item: RequestCreateItem) => {
      // write to s3
      const filePath = generateFilePath({
        id: item.requestId,
        name: SendDataEntity.request,
      });
      await store.put(filePath, item);

      // write to dynamo
      const request = new Request({
        ...item,
        filePath,
        workspaceId,
      });
      await put({
        Item: request.toItem(),
        TableName,
      });

      return request;
    },

    getPayload: async (
      requestId: string
    ): Promise<RequestPayload | undefined> => {
      try {
        if (!workspaceId) {
          throw new InvalidArgumentSendError(
            "workspaceId is required to call the request service."
          );
        }

        if (!requestId) {
          throw new InvalidArgumentSendError(
            "requestId is required to call the request service."
          );
        }

        const { pk, sk } = Request.key({ requestId, workspaceId });

        const Item = await getDynamoItem(pk, sk);

        const request = Request.fromItem(Item);

        const payload = await getS3Object(request.filePath);

        return {
          ...request.toItem(),
          message: payload.request.message,
          params: payload.params,
        };
      } catch (error) {
        if (error instanceof ArgumentRequiredError) {
          throw new InvalidArgumentSendError(error);
        }

        throw new UnknownSendError(error);
      }
    },
  };
};
