import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<{
  message: "text";
}> = {
  getTemplates: (template, config) => {
    const { opsgenie = {} } = config;
    const { message } = opsgenie;
    return {
      message: template.fromTextUnsafe(message),
      plain: template.plainRenderer(),
    };
  },
};

export default provider;
