import { ITemplateHandler } from "~/handlebars/template/types";
import { IProviderWithTemplates, ITemplates } from "~/providers/types";
export interface IInAppTemplates extends ITemplates {
  blocks?: "inApp";
  body?: "plain" | "markdown";
  actions?: "elemental";
  icon?: "text";
  title: "text" | "plain";
  preview?: "plain";
  elemental?: "elemental";
  html?: "email";
}

const getInAppTemplates: IProviderWithTemplates<IInAppTemplates>["getTemplates"] =
  (template, config, options) => {
    const {
      fromTextUnsafe,
      plainRenderer,
      inAppRenderer,
      markdownRenderer,
      slotRenderer,
      elementalRenderer,
      emailRenderer,
    } = template;

    const { version = "plain" } = config as { version: "plain" | "markdown" };
    const { title, icon } = config.push ?? ({} as any);

    const locales = options?.locales ?? undefined;
    const localizedTitle = config?.locale
      ? locales?.[config.locale]?.title ?? title
      : title;

    const blocksRenderer = inAppRenderer(version);
    const bodyRenderer =
      version === "plain"
        ? plainRenderer({ blockSeparator: "\n" })
        : markdownRenderer("github");

    const iconRenderer = fromTextUnsafe(icon);
    const titleRenderer =
      (slotRenderer("title") as ITemplateHandler<"plain">) ??
      fromTextUnsafe(localizedTitle);

    switch (config.channel) {
      case "banner": {
        return {
          blocks: blocksRenderer,
          body: bodyRenderer,
          title: titleRenderer,
        };
      }

      case "inbox": {
        return {
          actions: slotRenderer(
            "actions",
            "elemental"
          ) as ITemplateHandler<"elemental">,
          elemental: elementalRenderer(),
          html: emailRenderer(),
          icon: iconRenderer,
          preview: slotRenderer("preview") as ITemplateHandler<"plain">,
          title: titleRenderer,
        };
      }

      //should be "push"
      default: {
        return {
          blocks: blocksRenderer,
          body: bodyRenderer,
          title: titleRenderer,
          icon: iconRenderer,
        };
      }
    }
  };

export default getInAppTemplates;
