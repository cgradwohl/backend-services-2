import { NotFound } from "~/lib/http-errors";

import dynamoCodeService from "../dynamo/code-service";
import { daysToSeconds } from "../toSeconds";

import { IVerificationCodeObject } from "~/types.internal";

const objtype = "user-invitation-verification-code";
const expiresSeconds = daysToSeconds(7);
const ttlSeconds = daysToSeconds(7);

const verificationCode = dynamoCodeService<IVerificationCodeObject["data"]>(
  objtype,
  12,
  expiresSeconds,
  ttlSeconds
);

export const queryBeginsWith = verificationCode.queryBeginsWith;
export const queryByEmail = verificationCode.queryByEmail;
export const create = verificationCode.create;
export const remove = verificationCode.remove;
export const get = verificationCode.get;

export const verify = async (code: string) => {
  const record = await verificationCode.get(code);

  if (!record?.data?.email) {
    throw new NotFound("Invalid Invitation Code");
  }

  // do not limit invitation code to any particular email allow for
  // invitation to be accepted with any email to simplify sso signups
  return record;
};
