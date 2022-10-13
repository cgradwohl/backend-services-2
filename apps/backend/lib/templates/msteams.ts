import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IMSTeamsTemplates extends ITemplates {
  msteams: "msteams";
}

const getMSTeamsTemplates: IProviderWithTemplates<
  IMSTeamsTemplates
>["getTemplates"] = (template) => {
  return {
    msteams: template.msteamsRenderer(),
  };
};

export default getMSTeamsTemplates;
