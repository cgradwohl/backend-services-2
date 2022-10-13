import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IPlainTemplates extends ITemplates {
  plain: "plain";
}

const getPlainTemplates: IProviderWithTemplates<
  IPlainTemplates
>["getTemplates"] = (template) => {
  return {
    plain: template.plainRenderer(),
  };
};

export default getPlainTemplates;
