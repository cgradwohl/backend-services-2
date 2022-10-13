import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IDiscordTemplates extends ITemplates {
  md: "discord";
}

const getDiscordTemplates: IProviderWithTemplates<
  IDiscordTemplates
>["getTemplates"] = (template) => {
  return {
    md: template.discordRenderer(),
  };
};

export default getDiscordTemplates;
