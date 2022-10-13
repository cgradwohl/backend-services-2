import { IRetryableSqsMessage, RetryableMessageType } from "~/types.internal";
import captureException from "../capture-exception";
import getEnvVar from "../get-environment-variable";
import logger from "../logger";
import { put } from "./index";

const TableName = getEnvVar("DELIVERY_STATUS_TABLE_NAME");

const retryMessage = async (
  message: IRetryableSqsMessage<RetryableMessageType>
) => {
  try {
    const { tenantId, ttl } = message;
    const item = {
      pk: `${tenantId}/${message.type}/${message.messageId}`,
      id: `${message.type}/${message.messageId}`,
      json: message,
      tenantId,
      ttl,
    };

    await put({
      Item: item,
      TableName,
    });

    return;
  } catch (err) {
    captureException(err);
  }
};

export default retryMessage;
