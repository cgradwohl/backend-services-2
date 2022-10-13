import { CognitoUserPoolTriggerEvent } from "aws-lambda";

async function handle(event: CognitoUserPoolTriggerEvent) {
  event.response.autoConfirmUser = true;
  return event;
}

export default handle;
