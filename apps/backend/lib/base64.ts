type DecodeFn = (value: string) => string;
export const decode: DecodeFn = value =>
  Buffer.from(value, "base64").toString("utf8");

type EncodeFn = (value: string) => string;
export const encode: EncodeFn = value =>
  Buffer.from(value, "utf8").toString("base64");
