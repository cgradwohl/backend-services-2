import { nanoid } from "nanoid";

const generateS3Prefix = () => {
  return `${new Date().getMilliseconds()}/${nanoid()}`;
};

export default generateS3Prefix;
