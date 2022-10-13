import { NotFound } from "~/lib/http-errors";
import { getJson, putJson } from "../stores/s3/rendered-output";
import { IRenderedOutput } from "~/send/types";
import { NotFoundSendError, UnavailableSendError } from "../errors";

export const getRenderedOutput = async ({
  filePath,
}: {
  filePath: string;
}): Promise<IRenderedOutput> => {
  try {
    const json = await getJson({ filePath });

    return json;
  } catch (err) {
    if (err instanceof NotFound) {
      throw new NotFoundSendError(err, { filePath });
    }

    throw new UnavailableSendError(err, { filePath });
  }
};

export const putRenderedOutput = async ({
  messageId,
  json,
}: {
  messageId: string;
  json: IRenderedOutput;
}) => {
  const { filePath } = await putJson({
    messageId,
    json,
  });

  return { filePath };
};
