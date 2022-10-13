import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<{ md: "discord" }> = {
  getTemplates: (template) => ({ md: template.discordRenderer() }),
};

export default provider;
