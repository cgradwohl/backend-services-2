import { IProviderWithTemplates, ITemplates } from "~/providers/types";
export interface IPushTemplates extends ITemplates {
  body: "plain";
  title: "text";
  icon?: "text";
  clickAction?: "text";
}

const getPushTemplates: IProviderWithTemplates<IPushTemplates>["getTemplates"] =
  (template, config, options) => {
    const { fromTextUnsafe, plainRenderer } = template;
    const { title, icon, clickAction } = config.push ?? ({} as any);

    const locales = options?.locales ?? undefined;
    const localizedTitle = config?.locale
      ? locales?.[config.locale]?.title ?? title
      : title;

    return {
      body: plainRenderer({ blockSeparator: "\n" }),
      title: fromTextUnsafe(localizedTitle),
      icon: fromTextUnsafe(icon),
      clickAction: fromTextUnsafe(clickAction),
    };
  };

export default getPushTemplates;
