import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IFirebaseFCMTemplates extends ITemplates {
  plain: "plain";
  title: "text";
}

const getFirebaseFCMTemplates: IProviderWithTemplates<
  IFirebaseFCMTemplates
>["getTemplates"] = (template, config) => {
  const { firebaseFcm } = config;
  const { title } = firebaseFcm || {};

  return {
    plain: template.plainRenderer({ blockSeparator: "\n" }),
    title: template.fromTextUnsafe(title),
  };
};

export default getFirebaseFCMTemplates;
