import generateS3Prefix from "~/lib/generate-s3-prefix";
import { NotFound } from "~/lib/http-errors";
import s3 from "~/lib/s3";
import { NotFoundSendError, UnavailableSendError } from "~/send/errors";
import { IRequest } from "~/send/types";
import { FilePathGenerator, S3Get, S3Put } from "../types";

const store = s3<IRequest>(process.env.ACTION_STREAM_BUCKET!);

export const generateFilePath: FilePathGenerator = ({ requestId }) => {
  const prefix = generateS3Prefix();

  return `${prefix}/${requestId}_request.json`;
};

export const getJson: S3Get<IRequest | undefined | null> = async ({
  filePath,
}) => {
  try {
    return await store.get(filePath);
  } catch (error) {
    if (error instanceof NotFound) {
      throw new NotFoundSendError(
        `Request entity not found in S3:ActionStreamBucket. filePath: ${filePath}`
      );
    }

    throw new UnavailableSendError(error);
  }
};

export const putJson: S3Put<IRequest> = async ({ requestId, json }) => {
  const filePath = generateFilePath({ requestId });
  await store.put(filePath, json);

  return { filePath };
};
