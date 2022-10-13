import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<{
  summary: "text";
}> = {
  getTemplates: (template, config) => {
    const { splunkOnCall = {} } = config;
    const { summary } = splunkOnCall;

    return {
      plain: template.plainRenderer(),
      summary: template.fromTextUnsafe(summary),
    };
  },
};

export default provider;
