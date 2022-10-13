import { IProviderWithTemplates } from "../types";
import getPushTemplates, { IPushTemplates } from "~/lib/templates/push";

const provider: IProviderWithTemplates<
  IPushTemplates & {
    subtitle: "text";
  }
> = {
  getTemplates: (template, config) => {
    const { expo = {} } = config;
    const { subtitle, title } = expo;

    const pushTemplates = getPushTemplates(template, config);

    return {
      subtitle: template.fromTextUnsafe(subtitle),
      ...pushTemplates,
      title: pushTemplates.title ?? template.fromTextUnsafe(title),
    };
  },
};

export default provider;
