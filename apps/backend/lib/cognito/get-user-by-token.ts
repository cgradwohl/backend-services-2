import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();

export default async (accessToken: string) => {
  const {
    Username: externalId,
    UserAttributes,
  } = await cognitoIdentityServiceProvider
    .getUser({ AccessToken: accessToken })
    .promise();
  const { Value: email } = UserAttributes.find(({ Name }) => Name === "email");
  return { email, externalId };
};
