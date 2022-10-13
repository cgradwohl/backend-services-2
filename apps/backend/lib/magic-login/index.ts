import getCourierClient from "~/lib/courier";

import * as cognito from "~/lib/cognito";
import dynamoCodeService from "../dynamo/code-service";

const objtype = "magic-login-code";
const expiresSeconds = 600;
const ttlSeconds = 600; // remove code record after 10 mins

const courier = getCourierClient();
interface ICreateMagicCode {
  email: string;
  invitationCode?: string;
}

const magicLoginCode = dynamoCodeService<{
  email: string;
  userId: string;
  invitationCode?: string;
}>(objtype, 6, expiresSeconds, ttlSeconds);

export const create = async (
  { email, invitationCode }: ICreateMagicCode,
  origin: string
) => {
  let userId: string;
  let newUser = false;

  if (invitationCode && invitationCode.includes("google")) {
    throw new Error("Invitation Code requires Google SSO");
  }

  try {
    const user = await cognito.getUserByEmail(email);
    userId = user.id;
  } catch (err) {
    if (!(err instanceof cognito.UserNotFound)) {
      throw err;
    }

    newUser = true;
  }

  try {
    const existingCodes = await magicLoginCode.queryBeginsWith(email);

    await Promise.all(
      existingCodes.map(async (existingCode) => {
        await magicLoginCode.remove(existingCode.code);
      })
    );
  } catch (ex) {
    throw new Error(ex);
  }

  let accessCode: string;
  const { code: accessToken } = await magicLoginCode.create(
    {
      email,
      invitationCode,
      userId,
    },
    {
      transform: (code) => {
        accessCode = code;
        return `${email}/${code}`;
      },
    }
  );

  const magicLink = `${origin}/login/email?access_token=${encodeURIComponent(
    accessToken
  )}`;

  await courier.send({
    data: {
      accessCode,
      accessToken,
      magicLink,
      newUser,
    },
    eventId: newUser ? "WELCOME_TO_COURIER" : "LOGIN_TO_COURIER",
    profile: {
      email,
    },
    recipientId: userId || email,
  });
};

export const queryBeginsWith = magicLoginCode.queryBeginsWith;

export const get = magicLoginCode.get;

export const verify = async (code: string) => {
  const response = await magicLoginCode.get(code);

  await magicLoginCode.remove(code);
  return response;
};
