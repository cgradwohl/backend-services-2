import { CognitoIdentityServiceProvider } from "aws-sdk";
import makeError from "make-error";

import {
  getSignInProvider,
  getSignInProviderFromDomainOfEmail,
  isSsoUser,
} from "./sso";

import { IUserProvider } from "~/types.api";

export const UserNotFound = makeError("UserNotFound");

const cognito = new CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});

const UserPoolId = process.env.USER_POOL_ID;

export interface IUser {
  id: string;
  created: Date;
  enabled: boolean;
  email: string;
  email_verified: boolean;
  provider: IUserProvider;
}

const prettyRecord = (
  user: {
    Username?: string;
    UserCreateDate?: Date;
    Enabled?: boolean;
  },
  attributes: Array<{
    Name: string;
    Value?: string;
  }>
): IUser => {
  const { Enabled: enabled, Username: id, UserCreateDate: created } = user;

  const attributesMap: {
    [key: string]: string;
  } = attributes.reduce((attrs, att) => {
    attrs[att.Name] = att.Value;
    return attrs;
  }, {});

  const provider = getSignInProvider(id);

  // return a nicer record
  return {
    created,
    email: attributesMap.email,
    email_verified: attributesMap.email_verified === "true",
    enabled,
    id,
    provider,
  };
};

export const getUser = async (userId: string): Promise<IUser> => {
  const record = await cognito
    .adminGetUser({
      UserPoolId,
      Username: userId,
    })
    .promise();

  if (!record) {
    throw new UserNotFound();
  }

  return prettyRecord(record, record.UserAttributes);
};

export const createUser = async (email: string): Promise<IUser> => {
  const record = await cognito
    .adminCreateUser({
      MessageAction: "SUPPRESS",
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
      UserPoolId,
      Username: email,
    })
    .promise();

  const { User } = record;
  return prettyRecord(User, User.Attributes);
};

export const getUserByEmail = async (email: string): Promise<IUser> => {
  if (!email) {
    throw new Error("Missing Email");
  }

  const { Users } = await cognito
    .listUsers({
      Filter: `email="${email}"`,
      UserPoolId,
    })
    .promise();

  const userRecord = Users.find((u) => !isSsoUser(u.Username));

  if (!userRecord) {
    throw new UserNotFound();
  }

  return prettyRecord(userRecord, userRecord.Attributes);
};

export const getSsoUserByEmail = async (email: string): Promise<IUser> => {
  if (!email) {
    throw new Error("Missing Email");
  }

  const { Users } = await cognito
    .listUsers({
      Filter: `email="${email}"`,
      UserPoolId,
    })
    .promise();

  // This ensures we only get the user of the correct provider for the domain.
  // This is important as a user can have multiple identities in cognito with the same email.
  const provider = await getSignInProviderFromDomainOfEmail(email);
  const userRecord = Users.find(
    (u) => getSignInProvider(u.Username) === provider
  );

  if (!userRecord) {
    throw new UserNotFound();
  }

  return prettyRecord(userRecord, userRecord.Attributes);
};

export const updateUser = async (
  userId: string,
  attributes: {
    email?: string;
    email_verified?: boolean;
  },
  userPoolId?: string
) => {
  await cognito
    .adminUpdateUserAttributes({
      UserAttributes: Object.keys(attributes).map((Name) => ({
        Name,
        Value: String(attributes[Name]),
      })),
      UserPoolId: userPoolId || UserPoolId,
      Username: userId,
    })
    .promise();
  return true;
};
