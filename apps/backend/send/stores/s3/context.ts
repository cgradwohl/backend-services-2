import generateS3Prefix from "~/lib/generate-s3-prefix";
import { NotFound } from "~/lib/http-errors";
import s3 from "~/lib/s3";
import {
  NotFoundSendError,
  ResourceExhaustedSendError,
  UnknownSendError,
} from "~/send/errors";
import { ISendMessageContext } from "~/send/types";
import { FilePathGenerator, S3Get, S3Put } from "../types";

const store = s3<ISendMessageContext>(process.env.ACTION_STREAM_BUCKET!);

export const generateFilePath: FilePathGenerator = ({ messageId }) => {
  const prefix = generateS3Prefix();

  return `${prefix}/${messageId}_context.json`;
};

export const getContext: S3Get<ISendMessageContext | undefined | null> =
  async ({ filePath }) => {
    try {
      const json = await store.get(filePath);
      return json;
    } catch (err) {
      if (err instanceof NotFound) {
        throw new NotFoundSendError(err, { filePath });
      }
      throw new UnknownSendError(err, { filePath });
    }
  };

export const putContext: S3Put<ISendMessageContext> = async ({
  messageId,
  json,
}) => {
  const filePath = generateFilePath({ messageId });

  await store.put(filePath, json);

  return { filePath };
};
