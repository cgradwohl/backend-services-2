import fileType from "file-type";
import querystring from "querystring";
import sanitizeFilename from "sanitize-filename";

export const validateBase64Image = async ({
  type,
  name,
  data,
}: {
  type: string;
  name: string;
  data: string;
}) => {
  if (!data || !name || !type || name.includes("/")) {
    throw new Error("Invalid File");
  }

  const sanitizedFileName = sanitizeFilename(querystring.unescape(name));

  if (sanitizedFileName.includes(" ")) {
    throw new Error("Invalid File");
  }

  const base64Data = Buffer.from(
    data.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const mimeInfo = await fileType.fromBuffer(base64Data);

  if (
    !mimeInfo ||
    !["jpg", "jpeg", "png", "gif"].includes(mimeInfo.ext) ||
    !["image/jpeg", "image/png", "image/gif"].includes(mimeInfo.mime)
  ) {
    throw new Error("Invalid File");
  }

  if (type !== mimeInfo.mime) {
    throw new Error("Invalid File");
  }

  return {
    filename: sanitizedFileName,
    buffer: base64Data,
  };
};
