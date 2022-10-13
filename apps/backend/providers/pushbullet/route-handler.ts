import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<{
  title: "text";
}> = {
  getTemplates: (template, config) => {
    const { pushbullet = {} } = config;
    const { title } = pushbullet;
    return {
      title: template.fromTextUnsafe(title),
      plain: template.plainRenderer(),
    };
  },
};

export default provider;
