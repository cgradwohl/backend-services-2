import { IRetryableSqsMessage, RetryableMessageType } from "~/types.internal";
import captureException from "../capture-exception";
import { error } from "../log";
import { put } from "./index";

const TableName = process.env.DELIVERY_STATUS_TABLE_NAME;

const retryMessage = async (
  message: IRetryableSqsMessage<RetryableMessageType>
) => {
  try {
    const { tenantId, ttl } = message;
    const item = {
      id: `${message.type}/${message.messageId}`,
      json: JSON.stringify(message),
      tenantId,
      ttl,
    };

    await put({
      Item: item,
      TableName,
    });

    return;
  } catch (err) {
    error(err);
    captureException(err);
  }
};

export default retryMessage;
