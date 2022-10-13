import crypto from "crypto";
import { createMd5Hash } from "~/lib/crypto-helpers";
interface IHmacHeader {
  date: string;
  Authorization: string;
  "x-Content-MD5": string;
}

export const hmacHeaderUtil = (apiKey: string, apiSecret: string) => {
  const createHmacSignature = (date, contentSignature, url) => {
    const requestType = "POST";

    const signingString = `date: ${date}\n${contentSignature}${requestType} ${url} HTTP/1.1`;

    const hash = crypto
      .createHmac("sha1", apiSecret)
      .update(signingString)
      .digest("base64");

    return hash;
  };

  return {
    getHmacHeaders: (url: string, body: string): IHmacHeader => {
      const headers: IHmacHeader = {
        Authorization: "",
        date: "",
        "x-Content-MD5": "",
      };

      const dateHeader = new Date().toUTCString();
      const contentHash = createMd5Hash(body);
      const contentSignature = `x-Content-MD5: ${contentHash}\n`;
      const contentHeader = "x-Content-MD5 ";

      headers["x-Content-MD5"] = contentHash;
      headers.date = dateHeader;

      const hmacSignature = createHmacSignature(
        dateHeader,
        contentSignature,
        url
      );

      const hmacHeader = `hmac username="${apiKey}", algorithm="hmac-sha1", headers="date ${contentHeader}request-line", signature="${hmacSignature}"`;
      headers.Authorization = hmacHeader;
      return headers;
    },
  };
};
