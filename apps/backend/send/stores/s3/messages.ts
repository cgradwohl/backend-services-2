import generateS3Prefix from "~/lib/generate-s3-prefix";
import { NotFound } from "~/lib/http-errors";
import logger from "~/lib/logger";
import s3 from "~/lib/s3";
import { IMessage } from "~/send/types";
import { FilePathGenerator, S3Get, S3Put } from "../types";

const store = s3<IMessage>(process.env.ACTION_STREAM_BUCKET!);

export const generateFilePath: FilePathGenerator = ({ messageId }) => {
  const prefix = generateS3Prefix();

  return `${prefix}/${messageId}_message.json`;
};

export const getJson: S3Get<IMessage | undefined | null> = async ({
  filePath,
}) => {
  try {
    const json = await store.get(filePath);
    return json;
  } catch (err) {
    logger.error("::: ACTION_STREAM_BUCKET GET:MESSAGE ERROR :::");
    logger.error(err);
    if (err instanceof NotFound) {
      return;
    }
    throw err;
  }
};

export const putJson: S3Put<IMessage> = async ({ messageId, json }) => {
  const filePath = generateFilePath({ messageId });

  await store.put(filePath, json);

  return { filePath };
};
