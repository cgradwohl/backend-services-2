import { Handler, IDataFixEvent } from "./types";
import { requests } from "~/send/service/data";
import logger from "~/lib/logger";
import { getJson } from "~/send/stores/s3/requests";

interface IEvent extends IDataFixEvent {
  messageId: string;
  tenantId: string;
}

export const findMessageById: Handler<IEvent> = async (event) => {
  const messageId = event.messageId;
  const tenantId = event.tenantId;

  // get message from Send Data Table and Send Data Bucket
  const sendDataPayload = await requests(tenantId).getPayload(messageId);

  logger.debug("sendDataPayload ::", sendDataPayload);

  const actionBucketPayload = await getJson({
    filePath: sendDataPayload.originFilePath,
  });

  logger.debug("actionBucketPayload ::", actionBucketPayload);
};
