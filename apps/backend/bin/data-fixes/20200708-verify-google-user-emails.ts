import { Context } from "aws-lambda";
import { CognitoIdentityServiceProvider, Lambda } from "aws-sdk";

import { updateUser } from "~/lib/cognito";
import log, { warn } from "~/lib/log";

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
const lambda = new Lambda({ apiVersion: "2015-03-31" });
const limit = Number(process.env.LIMIT) || 60; // 60 = max limit
const userPoolId = process.env.USER_POOL_ID;

export default async (
  event: { paginationToken?: string },
  context: Context
) => {
  const { paginationToken } = event;
  const params = {
    Filter: 'username ^= "Google_"',
    Limit: limit,
    PaginationToken: paginationToken,
    UserPoolId: userPoolId,
  };

  const {
    PaginationToken,
    Users,
  } = await cognitoIdentityServiceProvider.listUsers(params).promise();

  log(`\n\nProcessing ${Users.length} users...\n\n`);

  for (const user of Users) {
    try {
      const id = user.Username;
      const email = user.Attributes.find((attr) => attr.Name === "email").Value;
      const emailVerifiedAttribute = user.Attributes.find(
        (attr) => attr.Name === "email_verified"
      );
      const emailVerified =
        emailVerifiedAttribute && emailVerifiedAttribute.Value
          ? JSON.parse(emailVerifiedAttribute.Value)
          : false;

      log(`${id} | ${email} | ${emailVerified}`);

      if (emailVerified) {
        log("  >> email already verified, skipping ⏩\n");
      } else {
        log("  >> email NOT verified, updating...");
        try {
          await updateUser(id, { email_verified: true }, userPoolId);
          log("  >> email successfully verified ✅\n");
        } catch (e) {
          warn(e && e.message ? e.message : e);
          warn("  >> email NOT verified 🔴\n");
        }
      }
    } catch (e) {
      warn(e);
      warn("  >> skipped due to error 🔴\n");
    }
  }

  if (PaginationToken) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({ paginationToken: PaginationToken }),
      })
      .promise();
  } else {
    log("Done! ✅✅✅");
  }
};
