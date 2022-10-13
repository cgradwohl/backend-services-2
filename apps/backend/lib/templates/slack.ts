import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface ISlackTemplates extends ITemplates {
  slackBlocks: "slack";
}

const getSlackTemplates: IProviderWithTemplates<
  ISlackTemplates
>["getTemplates"] = (template) => {
  return {
    slackBlocks: template.slackRenderer(),
    text: template.plainRenderer(),
  };
};

export default getSlackTemplates;
