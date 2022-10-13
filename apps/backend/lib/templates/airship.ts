import { IProviderWithTemplates, ITemplates } from "~/providers/types";

export interface IAirshipTemplates extends ITemplates {
  plain: "plain";
  title: "text";
}

const getAirshipTemplates: IProviderWithTemplates<
  IAirshipTemplates
>["getTemplates"] = (template, config) => {
  const { airship = {} } = config;
  const { title } = airship;

  return {
    plain: template.plainRenderer({ blockSeparator: "" }),
    title: template.fromTextUnsafe(title),
  };
};

export default getAirshipTemplates;
