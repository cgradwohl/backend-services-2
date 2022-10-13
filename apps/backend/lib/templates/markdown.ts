import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IMarkdownTemplates extends ITemplates {
  md: "markdown";
}

const getMarkdownTemplates: IProviderWithTemplates<
  IMarkdownTemplates
>["getTemplates"] = (template) => {
  return {
    md: template.markdownRenderer(),
  };
};

export default getMarkdownTemplates;
