import getHandlebarsTemplate from "~/handlebars/template/generation/template";
import {
  IBrandSettingsEmail,
  IBrandTemplateOverride,
} from "~/lib/brands/types";
import { Block, EmailJsonParams, ITenant } from "~/types.api";

import emailTemplates from "../partials/email/templates";
import getDiscordHandlebarsTemplate from "./discord";
import getElementalHandlebarsTemplate from "./elemental";
import getEmailHandlebarsTemplate from "./email";
import getInAppHandlebarsTemplate from "./in-app";
import getMarkdownHandlebarsTemplate from "./markdown";
import getMSTeamsHandlebarsTemplate from "./msteams";
import getPlainHandlebarsTemplate from "./plain";
import getSlackHandlebarsTemplate from "./slack";
import getTextHandlebarsTemplate from "./text";
import getWebhookHandlebarsTemplate from "./webhook";

import { oldJsonnetDefaultTemplate } from "~/handlebars/partials/webhook/default-jsonnet-template";
import { ITemplateHandler, TemplateConfig } from "./types";

export interface IProviderTemplateHandlers {
  discordRenderer: () => ITemplateHandler<"discord">;
  elementalRenderer: () => ITemplateHandler<"elemental">;
  emailRenderer: () => ITemplateHandler<"email">;
  fromText: (text: string, defaultText?: string) => ITemplateHandler<"text">;
  fromTextUnsafe: (
    text: string,
    defaultText?: string,
    cb?: (value: string) => string
  ) => ITemplateHandler<"text">;
  inAppRenderer: (version: "plain" | "markdown") => ITemplateHandler<"inApp">;
  markdownRenderer: (flavor?: "github") => ITemplateHandler<"markdown">;
  msteamsRenderer: () => ITemplateHandler<"msteams">;
  plainRenderer: (plainOptions?: {
    blockSeparator?: string;
    defaultText?: string;
    scope?: string;
  }) => ITemplateHandler<"plain">;
  slackRenderer: () => ITemplateHandler<"slack">;
  slotRenderer: (
    slotName: string,
    serializerType?: "elemental" | "plain"
  ) => ITemplateHandler<"plain"> | ITemplateHandler<"elemental">;
  webhookRenderer: () => ITemplateHandler<"webhook">;
  templateString: string;
}

const getEmailTemplateName = (
  email?: EmailJsonParams,
  brandTemplateOverride?: IBrandTemplateOverride
) => {
  if (brandTemplateOverride?.enabled) {
    return brandTemplateOverride?.mjml?.enabled ? "mjml" : "custom";
  }

  if (email?.emailTemplateConfig?.templateName) {
    return email.emailTemplateConfig.templateName;
  }

  return "none";
};

const getEmailPartials = (
  email?: EmailJsonParams,
  brandSettingsEmail?: IBrandSettingsEmail
) => {
  const brandTemplateOverride = brandSettingsEmail?.templateOverride;
  const templateName = getEmailTemplateName(email, brandTemplateOverride);
  let partials: { [partial: string]: string } = emailTemplates[templateName];

  if (!brandTemplateOverride?.enabled) {
    const brandSettingsEmailHead = brandSettingsEmail?.head;

    partials = {
      ...partials,
      "courier-brand-head":
        typeof brandSettingsEmailHead === "string"
          ? brandSettingsEmailHead
          : brandSettingsEmailHead?.content || "",
    };
  }

  if (templateName === "mjml" || templateName === "custom") {
    const source =
      templateName === "mjml"
        ? brandTemplateOverride?.mjml
        : brandTemplateOverride;

    partials = {
      ...partials,
      "courier-brand-footer": source.footer || "",
      "courier-brand-head": source.head || "",
      "courier-brand-header": source.header || "",
    };
  }

  return partials;
};

const getProviderTemplate = ({
  allBlocks,
  channelBlockIds,
  config,
  isEmail,
  isWebhook,
  provider,
  tenant,
  renderOverrides,
}: {
  allBlocks: Block[];
  channelBlockIds: string[];
  config?: TemplateConfig;
  isEmail?: boolean;
  isWebhook?: boolean;
  provider?: string;
  tenant?: ITenant;

  // TODO: Remove `renderOverrides` after we are all on V2 pipeline and replace
  // https://linear.app/trycourier/issue/C-7153/[studio-backend]-support-actions-message-preview
  // @riley @suhas
  // import getMSTeamsHandlebarsTemplate from "./msteams";
  // with
  // import getMSTeamsHandlebarsTemplate from "~/handlebars/template/msteams-with-adaptive-cards";
  renderOverrides?: (template: string) => Partial<IProviderTemplateHandlers>;
}): IProviderTemplateHandlers => {
  let emailConfig = isEmail && config.email ? config.email : undefined;
  const brandConfig = isEmail && config.brand ? config.brand : undefined;

  const usingOverride = Boolean(
    emailConfig?.isUsingTemplateOverride && emailConfig?.templateOverride
  );

  if (isWebhook && !channelBlockIds?.length) {
    allBlocks = [
      {
        id: "defaultBlock",
        type: "jsonnet",
        config: {
          template: oldJsonnetDefaultTemplate,
        },
      },
    ];
  }

  // compile the channel template
  const template = usingOverride
    ? emailConfig.templateOverride
    : getHandlebarsTemplate({
        allBlocks,
        blockIdsToRender: channelBlockIds,
        config,
        provider,
        tenant,
      });

  if (config.channel === "inbox" && !config?.slots?.preview?.length) {
    const firstTextBlockId = channelBlockIds.find((blockId) => {
      const block = allBlocks.find((b) => b.id === blockId);
      return block?.type === "text";
    });

    if (firstTextBlockId) {
      config.slots = config.slots ?? {};
      config.slots.preview = [firstTextBlockId];
    }
  }

  const slotTemplates = Object.keys(config.slots ?? {}).reduce(
    (acc, slotName) => {
      const slotBlockIds = config.slots[slotName] ?? [];
      acc[slotName] = getHandlebarsTemplate({
        allBlocks,
        blockIdsToRender: slotBlockIds,
        config,
        provider,
        tenant,
      });

      return acc;
    },
    {}
  );

  if (config.channel === "inbox") {
    emailConfig = {
      emailTemplateConfig: {
        templateName: "inbox",
      },
    };
  }

  const emailPartials = !usingOverride
    ? getEmailPartials(emailConfig, brandConfig?.email)
    : {};

  // emails must have an email config
  // so the rendering pipeline can hydrate the values
  // an undefined value here when it's email would cause errors later
  // (flags that the template should generate
  // inline partials for head, header, and footer)
  if ((isEmail || config.channel === "inbox") && !config.email) {
    config = { ...config, email: {} };
  }

  const partials = {
    ...config.partials,
    ...emailPartials,
  };

  return {
    discordRenderer: () => getDiscordHandlebarsTemplate(template),

    emailRenderer: () =>
      getEmailHandlebarsTemplate(template, { partials, usingOverride }),

    fromText: (text, defaultText) =>
      getTextHandlebarsTemplate({ text, defaultText }),

    fromTextUnsafe: (text, defaultText, cb) =>
      getTextHandlebarsTemplate({ text, defaultText, unsafe: true, cb }),

    inAppRenderer: (version) =>
      getInAppHandlebarsTemplate(template, {
        version,
      }),

    markdownRenderer: (flavor?: "github") =>
      getMarkdownHandlebarsTemplate(template, flavor),

    msteamsRenderer: () => getMSTeamsHandlebarsTemplate(template),

    webhookRenderer: () => getWebhookHandlebarsTemplate(template),

    elementalRenderer: () => getElementalHandlebarsTemplate(template),

    slotRenderer: (slotName: string, serializerType?: "elemental") => {
      if (!slotTemplates?.[slotName]) {
        return;
      }

      const slotBlocks = slotTemplates?.[slotName];
      switch (serializerType) {
        case "elemental": {
          return getElementalHandlebarsTemplate(slotBlocks);
        }

        default: {
          return getPlainHandlebarsTemplate(slotBlocks);
        }
      }
    },

    plainRenderer: (plainOptions) =>
      getPlainHandlebarsTemplate(template, { ...plainOptions, usingOverride }),

    slackRenderer: () => getSlackHandlebarsTemplate(template),

    // TODO: remove. For debug only
    templateString: template,

    // override template handler so we can add adaptive cards to MSTeams
    ...(renderOverrides ? renderOverrides(template) : {}),
  };
};

export default getProviderTemplate;
