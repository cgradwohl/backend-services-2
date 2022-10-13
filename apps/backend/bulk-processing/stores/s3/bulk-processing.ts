import { nanoid } from "nanoid";
import {
  InboundBulkMessage,
  InboundBulkMessageUser,
} from "~/bulk-processing/types";
import generateS3Prefix from "~/lib/generate-s3-prefix";
import s3 from "~/lib/s3";

const store = s3<any>(process.env.BULK_JOB_CONFIGURATION_STORE);

export default store;

export const putBulkJob = async (
  message: InboundBulkMessage
): Promise<string> => {
  const prefix = generateS3Prefix();
  const filename = nanoid();
  const key = `${prefix}/${filename}.json`;
  await store.put(key, message);
  return key;
};

export const putBulkMessageUser = async (
  user: InboundBulkMessageUser
): Promise<string> => {
  const prefix = generateS3Prefix();
  const filename = nanoid();
  const key = `${prefix}/${filename}.json`;
  await store.put(key, user);
  return key;
};

export const getBulkJob = async (key: string): Promise<InboundBulkMessage> => {
  const json = (await store.get(key)) as InboundBulkMessage;
  return json;
};

export const getBulkMessageUser = async (
  key: string
): Promise<InboundBulkMessageUser> => {
  const json = (await store.get(key)) as InboundBulkMessageUser;
  return json;
};
