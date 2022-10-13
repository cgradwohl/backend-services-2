import crypto from "crypto";

const getHexId = (length: number) => {
  const bytes = crypto.randomBytes(length);

  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16);
  }
  return hex.substring(0, length);
};

const getHexTime = () => {
  return Math.round(new Date().getTime() / 1000).toString(16);
};

export default () => `1-${getHexTime()}-${getHexId(24)}`;
