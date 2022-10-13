import {
  CourierObject,
  IChannelProvider,
  IConfigurationJson,
} from "~/types.api";

const courierSendgridApiKey = process.env.COURIER_SENDGRID_API_KEY;
const quickstartConfigurationId = "courier-internal-sendgrid";

const isQuickstartConfiguration = (configurationIds: string[]) =>
  configurationIds.includes(quickstartConfigurationId) &&
  configurationIds.length === 1;

const isQuickstartTemplate = (notificationId: string) =>
  notificationId === "courier-quickstart";

const quickstartChannelProvider: IChannelProvider = {
  configurationId: quickstartConfigurationId,
  key: process.env.COURIER_SENDGRID_API_KEY,
};

const quickstartConfiguration = (tenantId: string) =>
  ({
    updater: "courier-staff",
    updated: Date.now(),
    creator: "courier-staff",
    tenantId: tenantId,
    created: Date.now(),
    json: {
      apiKey: courierSendgridApiKey,
      checkDeliveryStatus: true,
      fromAddress: "Courier Quickstart <quickstart@courier.com>",
      provider: "sendgrid",
    },
    id: quickstartConfigurationId,
    objtype: "configuration",
    title: "Default Configuration",
  } as CourierObject<IConfigurationJson>);

export {
  isQuickstartConfiguration,
  isQuickstartTemplate,
  quickstartChannelProvider,
  quickstartConfiguration,
  quickstartConfigurationId,
};
