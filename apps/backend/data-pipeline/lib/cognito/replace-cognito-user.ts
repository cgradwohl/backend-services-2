import { CognitoIdentityServiceProvider } from "aws-sdk";
import * as dynamo from "~/lib/dynamo";
import userFactory from "./user-factory";

const replaceCognitoUser = async (
  cognitoUser: CognitoIdentityServiceProvider.UserType
) =>
  await dynamo.put({
    Item: userFactory(cognitoUser).create(),
    TableName: process.env.COGNITO_USERS_TABLE_NAME,
  });

export default replaceCognitoUser;
