import getPushTemplates, { IPushTemplates } from "~/lib/templates/push";
import { IProviderWithTemplates } from "../types";

type PusherTemplate =
  | {
      payload: "webhook";
    }
  | IPushTemplates;

const provider: IProviderWithTemplates<PusherTemplate> = {
  getTemplates: (template, config, { taxonomy, locales }) => {
    if (taxonomy === "push:web:pusher") {
      return {
        payload: template.webhookRenderer(),
      };
    }

    return getPushTemplates(template, config, { locales });
  },
};

export default provider;
