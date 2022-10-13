import listTenants from "~/lib/tenant-service/list";

import { CognitoIdentityServiceProvider } from "aws-sdk";
import { getSignInProvider } from "~/lib/cognito/sso";
import { IUserProvider } from "~/types.api";

const cognito_sdk = new CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});

const UserPoolId = process.env.USER_POOL_ID;

export default async (email: string, currentProvider: IUserProvider) => {
  const { Users } = await cognito_sdk
    .listUsers({
      Filter: `email="${email}"`,
      UserPoolId,
    })
    .promise();

  //Get accounts that are not currently logged in and have at least one tenant
  const altAccounts = await Users.reduce(async (acc, u) => {
    const accounts = await acc;
    const provider = getSignInProvider(u.Username);

    const valid =
      provider !== currentProvider && (await listTenants(u.Username)).length;

    return valid ? [...accounts, provider] : accounts;
  }, Promise.resolve([]));

  return altAccounts;
};
