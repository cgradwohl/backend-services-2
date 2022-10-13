import { Context } from "aws-lambda";
import { CognitoIdentityServiceProvider, Lambda } from "aws-sdk";
import replaceCognitoUser from "../lib/cognito/replace-cognito-user";

const cognito = new CognitoIdentityServiceProvider();
const lambda = new Lambda({ apiVersion: "2015-03-31" });
interface IEvent {
  paginationToken?: string;
}

export const handle = async ({ paginationToken }: IEvent, context: Context) => {
  const { Users, PaginationToken } = await cognito
    .listUsers({
      PaginationToken: paginationToken,
      UserPoolId: process.env.USER_POOL_ID,
    })
    .promise();

  if (PaginationToken) {
    await lambda
      .invoke({
        FunctionName: context.functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({ paginationToken: PaginationToken }),
      })
      .promise();
  }

  await Promise.all(Users.map(replaceCognitoUser));
};
