import { BadRequest, Unauthorized } from "../lib/http-errors";
import s3 from "../lib/s3";
import { S3Message } from "../types.internal";

import { validateBase64Image } from "~/lib/images";

import { assertBody, handleCognito } from "../lib/lambda-response";
const { putImage } = s3<S3Message>(process.env.S3_LIBRARY_BUCKET);

export const upload = handleCognito<string>(async (context) => {
  if (!context.userId) {
    throw new Unauthorized();
  }

  const body = assertBody<{
    name: string;
    data: string;
    type: string;
  }>(context);

  try {
    const { buffer, filename } = await validateBase64Image(body);
    const date = new Date();
    const name = `${context.tenantId}/${date.getTime()}_${filename}`;

    await putImage({
      buffer,
      name,
      type: body.type,
    });

    return {
      body: `https://${process.env.S3_LIBRARY_BUCKET}.s3.amazonaws.com/${name}`,
    };
  } catch (ex) {
    throw new BadRequest(String(ex));
  }
});
