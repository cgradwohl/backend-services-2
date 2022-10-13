import { CognitoUserPoolTriggerEvent } from "aws-lambda";

import { updateUser } from "~/lib/cognito";
import { verify as verifyMagicLogin } from "~/lib/magic-login";

async function handle(event: CognitoUserPoolTriggerEvent) {
  const code = await verifyMagicLogin(event.request.challengeAnswer);

  const activeCodes = Object.keys(event.request.privateChallengeParameters).map(
    (key) => {
      return event.request.privateChallengeParameters[key];
    }
  );

  if (
    !activeCodes.includes(code.code) ||
    Number(code.expires) <= Math.floor(Date.now() / 1000)
  ) {
    event.response.answerCorrect = false;
    return event;
  }

  if (event.request.userAttributes.email_verified !== "true") {
    await updateUser(
      event.userName,
      {
        email_verified: true,
      },
      event.userPoolId
    );
  }

  event.response.answerCorrect = true;
  return event;
}

export default handle;
