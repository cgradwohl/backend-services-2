import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<{
  plain: "plain";
  title: "text";
  category: "text";
}> = {
  getTemplates: (template, config) => {
    const { beamer = {} } = config;
    const { title, category } = beamer;

    return {
      plain: template.plainRenderer({ blockSeparator: "\n" }),
      title: template.fromTextUnsafe(title),
      category: template.fromTextUnsafe(category),
    };
  },
};

export default provider;
