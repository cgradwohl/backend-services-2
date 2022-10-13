import {
  CourierObject,
  IChannelProvider,
  IConfigurationJson,
} from "~/types.api";

const courierSendgridApiKey = process.env.COURIER_SENDGRID_API_KEY;
const personalizedWelcomeConfigurationId =
  "courier-internal-sendgrid-personalized-welcome";

const isPersonalizedWelcomeConfiguration = (configurationIds: string[]) =>
  configurationIds.includes(personalizedWelcomeConfigurationId) &&
  configurationIds.length === 1;

const isPersonalizedWelcomeTemplate = (notificationId: string) =>
  notificationId === "personalized-welcome-email";

const personalizedWelcomeChannelProvider: IChannelProvider = {
  configurationId: personalizedWelcomeConfigurationId,
  key: process.env.COURIER_SENDGRID_API_KEY,
};

const personalizedWelcomeConfiguration = (tenantId: string) =>
  ({
    updater: "courier-staff",
    updated: Date.now(),
    creator: "courier-staff",
    tenantId: tenantId,
    created: Date.now(),
    json: {
      apiKey: courierSendgridApiKey,
      checkDeliveryStatus: true,
      fromAddress: "Courier <support@courier.com>",
      provider: "sendgrid",
    },
    id: personalizedWelcomeConfigurationId,
    objtype: "configuration",
    title: "Default Configuration",
  } as CourierObject<IConfigurationJson>);

export {
  isPersonalizedWelcomeConfiguration,
  isPersonalizedWelcomeTemplate,
  personalizedWelcomeChannelProvider,
  personalizedWelcomeConfiguration,
  personalizedWelcomeConfigurationId,
};
