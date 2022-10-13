import { IRenderedTemplatesMap } from "~/handlebars/template/render-templates";
import generateS3Prefix from "~/lib/generate-s3-prefix";
import { NotFound } from "~/lib/http-errors";
import s3 from "~/lib/s3";
import { DeliveryHandlerParams } from "~/providers/types";
import { IRenderedOutput } from "~/send/types";
import { FilePathGenerator, S3Get, S3Put } from "../types";

const store = s3<IRenderedOutput>(process.env.ACTION_STREAM_BUCKET!);

export const generateFilePath: FilePathGenerator = ({ messageId }) => {
  const prefix = generateS3Prefix();

  return `${prefix}/${messageId}_output.json`;
};

export const getJson: S3Get<IRenderedOutput | undefined | null> = async ({
  filePath,
}) => {
  try {
    const json = await store.get(filePath);
    return json;
  } catch (err) {
    if (err instanceof NotFound) {
      return;
    }
    throw err;
  }
};

export const putJson: S3Put<{
  deliveryHandlerParams: DeliveryHandlerParams;
  renderedTemplates: IRenderedTemplatesMap;
}> = async ({ messageId, json }) => {
  const filePath = generateFilePath({ messageId });

  await store.put(filePath, json);

  return { filePath };
};
