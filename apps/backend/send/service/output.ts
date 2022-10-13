import { NotFound } from "~/lib/http-errors";
import { get, put } from "../stores/s3";
import { ISendMessageContext } from "~/send/types";

const makeKey = (channelId: string, providerId: string) =>
  `${channelId}/${providerId}/output.json`;

export const getOutput = async ({
  context,
  channelId,
  providerId,
  requestId,
  messageId,
}: {
  context: ISendMessageContext;
  channelId: string;
  providerId: string;
  messageId: string;
  requestId: string;
}) => {
  try {
    const json = await get({
      context,
      key: makeKey(channelId, providerId),
      messageId,
      requestId,
    });

    return json;
  } catch (err) {
    if (err instanceof NotFound) {
      return;
    }
    throw err;
  }
};

export const putOutput = async ({
  context,
  channelId,
  providerId,
  requestId,
  messageId,
  json,
}: {
  context: ISendMessageContext;
  channelId: string;
  providerId: string;
  messageId: string;
  requestId: string;
  json: any;
}) => {
  await put({
    context,
    key: makeKey(channelId, providerId),
    messageId,
    requestId,
    json,
  });
};
