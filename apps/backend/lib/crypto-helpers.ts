import crypto from "crypto";

import { decode, encode } from "./base64";

const algorithm = "aes-256-cbc";
const key256bit =
  process.env.NODE_ENV === "production"
    ? process.env.CRYPTO_PRIVATE_KEY_256
    : "jXn2r5u8x!A%D*G-KaPdSgVkYp3s6v9y"; // dev key only

export const encrypt = (text: string): string => {
  if (!key256bit) {
    throw new Error("Missing environment variable: CRYPTO_PRIVATE_KEY_256");
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key256bit), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const base64 = encode(
    JSON.stringify({
      encryptedData: encrypted.toString("hex"),
      iv: iv.toString("hex"),
    })
  );
  return base64;
};

export const decrypt = (text: string): string => {
  if (!key256bit) {
    throw new Error("Missing environment variable: CRYPTO_PRIVATE_KEY_256");
  }
  const jsonText = JSON.parse(decode(text));
  const iv = Buffer.from(jsonText.iv, "hex");
  const encryptedText = Buffer.from(jsonText.encryptedData, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key256bit),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const createMd5Hash = (body: string): string => {
  return crypto.createHash("md5").update(body).digest("hex");
};
