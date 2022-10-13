import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IExpoTemplates extends ITemplates {
  plain: "plain";
  subtitle: "text";
  title: "text";
}

const getExpoTemplates: IProviderWithTemplates<
  IExpoTemplates
>["getTemplates"] = (template, config) => {
  const { expo = {} } = config;
  const { subtitle, title } = expo;

  return {
    plain: template.plainRenderer({ blockSeparator: "\n" }),
    subtitle: template.fromTextUnsafe(subtitle),
    title: template.fromTextUnsafe(title),
  };
};

export default getExpoTemplates;
