import { IProviderWithTemplates } from "../types";

const provider: IProviderWithTemplates<{
  plain: "plain";
  quotedMsgId: "text";
  mentionedPhones: "text";
}> = {
  getTemplates: (template, config) => {
    const { chatApi = {} } = config;
    const { quotedMsgId, mentionedPhones } = chatApi;

    return {
      plain: template.plainRenderer({ blockSeparator: "\n" }),
      quotedMsgId: template.fromTextUnsafe(quotedMsgId),
      mentionedPhones: template.fromTextUnsafe(mentionedPhones),
    };
  },
};

export default provider;
