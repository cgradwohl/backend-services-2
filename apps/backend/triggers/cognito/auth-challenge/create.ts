import { CognitoUserPoolTriggerEvent } from "aws-lambda";
import * as magicLogin from "~/lib/magic-login";

async function handle(event: CognitoUserPoolTriggerEvent) {
  const codes = await magicLogin.queryBeginsWith(
    event.request?.userAttributes?.email
  );

  event.response.privateChallengeParameters = {};
  codes.forEach((code, index) => {
    event.response.privateChallengeParameters[`magicCode${index}`] = code.code;
  });

  return event;
}

export default handle;
