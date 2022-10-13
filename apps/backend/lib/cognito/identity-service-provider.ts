import * as AWS from "aws-sdk";
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});

export async function adminGetUser(
  args: AWS.CognitoIdentityServiceProvider.AdminGetUserRequest
): Promise<AWS.CognitoIdentityServiceProvider.AdminGetUserResponse> {
  return cognitoIdentityServiceProvider.adminGetUser(args).promise();
}
