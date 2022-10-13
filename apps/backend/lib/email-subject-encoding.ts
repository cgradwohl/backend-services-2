import logger from "~/lib/logger";

export const hasUnicode = (str: string) => {
  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) return true;
  }
  return false;
};

export const encode = (subject: string, maxLength?: number) => {
  if (!hasUnicode(subject)) {
    return subject;
  }

  if (maxLength) {
    subject = subject.slice(0, maxLength).trim();
  }

  const buffer = Buffer.from(subject);
  const encodedSubject = `=?UTF-8?B?${buffer.toString("base64")}?=`;

  // postmark breaks when we send encoded messages > 78
  if (maxLength && encodedSubject.length > maxLength) {
    return encode(subject.slice(0, -1), maxLength);
  }

  return encodedSubject;
};

export const decode = (subject: string) => {
  try {
    if (!subject) {
      return "";
    }

    if (!subject.includes("=?UTF-8?B?")) {
      return subject;
    }

    const subjectSplit = subject.split("?");
    return Buffer.from(subjectSplit[3], "base64").toString("utf-8");
  } catch (ex) {
    logger.warn(`Error decoding subject ${subject}`);
    return subject;
  }
};
