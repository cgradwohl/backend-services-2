// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import { ProviderConfigurationError, ProviderResponseError } from "../errors";
import { DeliveryHandler } from "../types";

interface IAfricasTalkingResponse {
  SMSMessageData: {
    Message: string;
    Recipients: Array<{
      statusCode: number;
      number: string;
      status: string;
      cost: string;
      messageId: string;
    }>;
  };
}

const send: DeliveryHandler = async (params, template) => {
  const config = (params.config as unknown) as {
    apiKey: string;
    username: string;
    from?: string;
  };

  if (!config.apiKey || !config.apiKey.length) {
    throw new ProviderConfigurationError("No API Key specified.");
  } else if (!config.username || !config.username.length) {
    throw new ProviderConfigurationError(
      "No Africas Talking Application Username specified."
    );
  }

  const { profile } = params;

  try {
    const client = require("africastalking")({
      apiKey: config.apiKey,
      username: config.username,
    });

    const smsClient = client.SMS;

    const request = {
      message: template.plain,
      to: [profile.phone_number],
    };
    const options =
      params.override && params.override.body
        ? jsonMerger.mergeObjects([request, params.override.body])
        : request;
    const response = await smsClient
      .send(options)
      .then((res: IAfricasTalkingResponse) => {
        const recipients = res.SMSMessageData.Recipients;

        if (recipients.length === 0) {
          throw new ProviderResponseError(res.SMSMessageData.Message);
        }

        recipients.forEach((recipient) => {
          if (recipient.statusCode > 400) {
            throw new ProviderResponseError(res.SMSMessageData.Message);
          }
        });

        return res;
      });

    return response;
  } catch (err) {
    if (err instanceof ProviderResponseError) {
      throw err;
    }

    throw new ProviderResponseError(JSON.stringify(err, null, 2));
  }
};

export default send;
