import getPushTemplates, { IPushTemplates } from "~/lib/templates/push";
import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<
  IPushTemplates & {
    topic: "text";
  }
> = {
  getTemplates: (template, config) => {
    const apn = config?.apn;
    const topic = apn?.topic;
    const title = apn?.title;

    const pushTemplates = getPushTemplates(template, config);

    return {
      ...pushTemplates,
      title: pushTemplates.title ?? template.fromTextUnsafe(title),
      topic: template.fromTextUnsafe(topic, ""),
    };
  },
};

export default provider;
