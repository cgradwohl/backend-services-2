import { CognitoUserPoolTriggerEvent } from "aws-lambda";
import courierClient from "~/lib/courier";

import createAuthChallenge from "./auth-challenge/create";
import defineAuthChallenge from "./auth-challenge/define";
import verifyAuthChallenge from "./auth-challenge/verify";
import preSignUp from "./pre-sign-up";

export async function handle(event: CognitoUserPoolTriggerEvent) {
  switch (event.triggerSource) {
    case "PreSignUp_AdminCreateUser":
    case "PreSignUp_SignUp":
      return preSignUp(event);
    case "CreateAuthChallenge_Authentication":
      return createAuthChallenge(event);
    case "DefineAuthChallenge_Authentication":
      return defineAuthChallenge(event);
    case "VerifyAuthChallengeResponse_Authentication":
      return verifyAuthChallenge(event);

    // this fires for SSO
    case "PostConfirmation_ConfirmSignUp": {
      const email = event.request?.userAttributes?.email;
      await courierClient().replaceProfile({
        recipientId: event.userName,
        profile: {
          courier: {
            channel: event.userName,
          },
          email,
        },
      });
      return event;
    }

    case "PostAuthentication_Authentication":
      const email = event.request?.userAttributes?.email;

      // email_verified is auto true for SSO
      // we set email_verified after first successful login
      if (event.request.userAttributes.email_verified) {
        return event;
      }

      await courierClient().replaceProfile({
        recipientId: event.userName,
        profile: {
          courier: {
            channel: event.userName,
          },
          email,
        },
      });
      return event;
    default:
      return event;
  }
}
