import generateS3Prefix from "~/lib/generate-s3-prefix";
import { FilePathGenerator } from "../types";

export const generateFilePath: FilePathGenerator = ({ id, name }) => {
  const prefix = generateS3Prefix();

  return `${prefix}/${id}_${name}.json`;
};
