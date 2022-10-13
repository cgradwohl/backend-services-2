// tslint:disable-next-line: no-var-requires
const plivo = require("plivo");

import { ProviderConfigurationError, ProviderResponseError } from "../errors";
import { DeliveryHandler } from "../types";

const send: DeliveryHandler = async (params, templates) => {
  const config = (params.config as unknown) as {
    authId: string;
    authToken: string;
    fromNumber: string;
  };

  if (!config.authId) {
    throw new ProviderConfigurationError("No Auth ID specified.");
  }

  if (!config.authToken) {
    throw new ProviderConfigurationError("No Auth Token specified.");
  }

  if (!config.fromNumber) {
    throw new ProviderConfigurationError("No From Number specified.");
  }

  const { profile } = params;

  try {
    const client = new plivo.Client(config.authId, config.authToken);
    const res = await client.messages.create(
      config.fromNumber,
      profile.phone_number as string,
      templates.plain
    );
    return res;
  } catch (e) {
    throw new ProviderResponseError(e);
  }
};

export default send;
