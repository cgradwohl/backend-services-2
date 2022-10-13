import {
  ErrorCode,
  IncomingWebhook as SlackWebhookClient,
} from "@slack/webhook";
import { ProviderResponseError } from "../errors";
import { ISlackMessage } from "./send";

export const getSlackWebhookFromProfile = (profile: {
  slack?: any;
}): string | undefined => {
  if (
    !profile.slack ||
    typeof profile.slack !== "object" ||
    !profile.slack.incoming_webhook ||
    typeof profile.slack.incoming_webhook !== "object" ||
    !profile.slack.incoming_webhook.url ||
    typeof profile.slack.incoming_webhook.url !== "string"
  ) {
    return;
  }

  return profile.slack.incoming_webhook.url;
};

export const slackWebhookSend = async (
  webhookUrl: string,
  message: ISlackMessage
) => {
  const client = new SlackWebhookClient(webhookUrl);

  try {
    return await client.send(message);
  } catch (err) {
    if (!err.code) {
      throw err;
    }

    // https://api.slack.com/messaging/webhooks#handling_errors
    switch (err.code) {
      case ErrorCode.HTTPError:
        const { statusCode, ...rest } = err;
        throw new ProviderResponseError(
          `${ErrorCode.HTTPError} with ${statusCode}`,
          rest
        );
      case ErrorCode.RequestError:
        throw new ProviderResponseError(ErrorCode.RequestError, err.original);
    }
  }
};
