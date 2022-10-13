import { IProviderWithTemplates, ITemplates } from "../types";

interface ISlackTemplates extends ITemplates {
  slackBlocks: "slack";
  text: "plain";
}

const provider: IProviderWithTemplates<ISlackTemplates> = {
  getTemplates: (template) => ({
    slackBlocks: template.slackRenderer(),
    text: template.plainRenderer(),
  }),
};

export default provider;
