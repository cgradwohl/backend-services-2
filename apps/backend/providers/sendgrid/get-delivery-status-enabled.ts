import { GetDeliveryStatusEnabledFn } from "../types";

import sendgrid from ".";

// Until we support webhooks for SG, true from the configuration assumes POLLING support.
const getDeliveryStatusEnabled: GetDeliveryStatusEnabledFn = configuration => {
  const { checkDeliveryStatus } = (configuration.json as unknown) as {
    checkDeliveryStatus?: boolean;
  };

  return checkDeliveryStatus && sendgrid.deliveryStatusStrategy === "POLLING";
};

export default getDeliveryStatusEnabled;
