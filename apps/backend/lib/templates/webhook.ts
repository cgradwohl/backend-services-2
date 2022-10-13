import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IWebhookTemplates extends ITemplates {
  payload: "webhook";
}

const getTemplates: IProviderWithTemplates<
  IWebhookTemplates
>["getTemplates"] = (template) => {
  return {
    payload: template.webhookRenderer(),
  };
};

export default getTemplates;
