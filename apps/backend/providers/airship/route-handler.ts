import getPushTemplates, { IPushTemplates } from "~/lib/templates/push";

import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<IPushTemplates> = {
  getTemplates: (template, config) => {
    const { airship = {} } = config;
    const { title } = airship;

    const pushTemplates = getPushTemplates(template, config);

    return {
      ...pushTemplates,
      title: pushTemplates.title ?? template.fromTextUnsafe(title),
    };
  },
};

export default provider;
