import util from "util";

import { ProviderConfigurationError, ProviderResponseError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, template) => {
  const config = params.config as unknown as {
    accessKey: string;
    originator: string;
  };

  if (!config.accessKey || !config.accessKey.length) {
    throw new ProviderConfigurationError("No Access Key specified.");
  } else if (!config.originator || !config.originator.length) {
    throw new ProviderConfigurationError("No Originating Number specified.");
  }

  const { profile } = params;

  try {
    const client = require("messagebird")(
      config.accessKey,
      DEFAULT_PROVIDER_TIMEOUT_MS
    );
    const createMessage = util.promisify(client.messages.create);
    const res = await createMessage({
      body: template.plain,
      originator: config.originator,
      recipients: profile.phone_number as string,
    });
    return res;
  } catch (e) {
    throw new ProviderResponseError(e);
  }
};

export default send;
