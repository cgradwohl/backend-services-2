import { CognitoUserPoolTriggerEvent } from "aws-lambda";

async function handle(event: CognitoUserPoolTriggerEvent) {
  if (
    event.request.session &&
    event.request.session.length &&
    event.request.session.slice(-1)[0].challengeResult === true
  ) {
    // The user provided the right answer - issue their tokens
    event.response.failAuthentication = false;
    event.response.issueTokens = true;
    return event;
  }

  // Present a new challenge if we haven't received a correct answer yet
  event.response.issueTokens = false;
  event.response.failAuthentication = false;
  event.response.challengeName = "CUSTOM_CHALLENGE";
  return event;
}

export default handle;
