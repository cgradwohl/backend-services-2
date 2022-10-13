import cheerio from "cheerio";
import handlebars from "handlebars";

import { Value } from "slate";
import * as emailTemplates from "~/components/email-templates";
import courierHandlebarsHelpers from "~/handlebars/helpers";
import { ISerializableBlock } from "~/lib/blocks/serialize";
import { warn } from "~/lib/log";
import {
  DeliveryHandlerParams,
  IProviderRenderHandler,
} from "~/providers/types";
import { EmailTemplateConfig } from "~/types.api";

import renderBlocks from "./blocks";

// these sendwithus helpers can be removed once the handlebars update ships
import swuDateTimeFormatHelper from "~/handlebars/helpers/universal/sendwithus/date-time-format";
import swuISO8601ToTimeHelper from "~/handlebars/helpers/universal/sendwithus/iso8601-to-time";
import swuTimestampToTimeHelper from "~/handlebars/helpers/universal/sendwithus/timestamp-to-time";
// end sendwithus helpers

const renderEmail: IProviderRenderHandler = (
  blocks: ISerializableBlock[],
  params: DeliveryHandlerParams
) => {
  const {
    tenant,
    brand,
    emailBCC,
    emailCC,
    emailFrom,
    emailReplyTo,
    emailSubject,
    emailTemplateConfig: emailTemplateWireConfig = {},
    handlebars: { partials } = { partials: null },
    isUsingTemplateOverride,
    linkHandler,
    templateOverride = "",
    variableHandler,
  } = params;

  const hbsContext = variableHandler.resolve("@", [])[0];
  const handlebarsTemplateOptions = {
    data: {
      variableHandler,
    },
    helpers: courierHandlebarsHelpers.universal,
    partials,
  };

  const profileVariableHandler = variableHandler.getRoot().getScoped("profile");
  const courierVariableHandler = variableHandler.getRoot().getScoped("courier");

  // these sendwithus helpers can be removed once the handlebars update ships
  handlebars.registerHelper("swu_datetimeformat", swuDateTimeFormatHelper);
  handlebars.registerHelper("swu_iso8601_to_time", swuISO8601ToTimeHelper);
  handlebars.registerHelper("swu_timestamp_to_time", swuTimestampToTimeHelper);
  // end sendwithus helpers

  handlebars.registerHelper("path", variableHandler.resolve);
  handlebars.registerHelper("profile", profileVariableHandler.resolve);
  handlebars.registerHelper("courier", courierVariableHandler.resolve);

  if (isUsingTemplateOverride && templateOverride.length > 0) {
    let renderedHtml;

    try {
      const compiledTemplate = handlebars.compile(templateOverride);
      renderedHtml = compiledTemplate(hbsContext, handlebarsTemplateOptions);
    } catch (e) {
      warn(e);
      renderedHtml = `<div style="color: red">Error Rendering Template: ${String(
        e
      ).replace("Error: ", "")}</div>`;
    }

    const $ = cheerio.load(renderedHtml);
    const text = $("body").text().trim();

    return {
      bcc: emailBCC && variableHandler.replace(emailBCC),
      cc: emailCC && variableHandler.replace(emailCC),
      from: emailFrom && variableHandler.replace(emailFrom),
      html: renderedHtml,
      replyTo: emailReplyTo && variableHandler.replace(emailReplyTo),
      subject: variableHandler.replace(emailSubject) || "(no subject)",
      text,
    };
  }

  const footerText =
    Value.isValue(emailTemplateWireConfig.footerText) ||
    !emailTemplateWireConfig.footerText
      ? emailTemplateWireConfig.footerText
      : Value.fromJSON(JSON.parse(emailTemplateWireConfig.footerText));

  const emailTemplateConfig: EmailTemplateConfig = {
    ...emailTemplateWireConfig,
    footerText,
  };

  const brandEmailSettings = brand?.settings?.email;
  const brandTemplateOverride = brandEmailSettings?.templateOverride;

  let templateName = emailTemplateConfig.templateName || "none";
  let renderedHead;

  // this needs to be before renderBlocks so we can use {{set}} in brand head
  if (!brandTemplateOverride || !brandTemplateOverride.enabled) {
    const compiledHeadTemplate = handlebars.compile(
      typeof brandEmailSettings?.head === "string"
        ? brandEmailSettings?.head
        : brandEmailSettings?.head?.content || ""
    );

    renderedHead = compiledHeadTemplate(hbsContext, handlebarsTemplateOptions);
  }

  const renderedBlocks = renderBlocks(blocks, "html").join("");
  const renderedText = renderBlocks(blocks, "plain").join("\n\n");
  const renderedSubject = variableHandler.replace(emailSubject || "");

  if (brandTemplateOverride && brandTemplateOverride.enabled) {
    let renderedHtml;

    const mjmlConfig = brandTemplateOverride.mjml || {
      enabled: false,
      head: "",
      header: "",
      footer: "",
    };

    const templateOverrides = mjmlConfig.enabled
      ? mjmlConfig
      : brandTemplateOverride;

    try {
      const compiledHeadTemplate = handlebars.compile(
        templateOverrides.head || ""
      );
      const compiledHeaderTemplate = handlebars.compile(
        templateOverrides.header || ""
      );
      const compiledFooterTemplate = handlebars.compile(
        templateOverrides.footer || ""
      );

      const renderedHead = compiledHeadTemplate(
        hbsContext,
        handlebarsTemplateOptions
      );
      const renderedHeader = compiledHeaderTemplate(
        hbsContext,
        handlebarsTemplateOptions
      );
      const renderedFooter = compiledFooterTemplate(
        hbsContext,
        handlebarsTemplateOptions
      );

      const emailTemplateRenderer = mjmlConfig.enabled
        ? emailTemplates.mjml
        : emailTemplates.custom;

      renderedHtml = emailTemplateRenderer(
        {
          blocks: renderedBlocks,
          footer: renderedFooter,
          head: renderedHead,
          header: renderedHeader,
        },
        templateOverrides,
        variableHandler
      );
    } catch (e) {
      warn(e);
      renderedHtml = `<div style="color: red">Error Rendering Template: ${String(
        e
      ).replace("Error: ", "")}</div>`;
    }

    const $ = cheerio.load(renderedHtml);
    const text = $("body").text().trim();

    return {
      bcc: emailBCC && variableHandler.replace(emailBCC),
      cc: emailCC && variableHandler.replace(emailCC),
      from: emailFrom && variableHandler.replace(emailFrom),
      html: renderedHtml,
      replyTo: emailReplyTo && variableHandler.replace(emailReplyTo),
      subject: variableHandler.replace(emailSubject) || "(no subject)",
      text,
    };
  }

  const renderedHtml = emailTemplates[templateName](
    tenant,
    {
      blocks: renderedBlocks,
      head: renderedHead,
    },
    emailTemplateConfig,
    linkHandler,
    variableHandler
  );

  return {
    bcc: emailBCC && variableHandler.replace(emailBCC),
    cc: emailCC && variableHandler.replace(emailCC),
    from: emailFrom && variableHandler.replace(emailFrom),
    html: renderedHtml,
    replyTo: emailReplyTo && variableHandler.replace(emailReplyTo),
    subject: renderedSubject || "(no subject)",
    text: renderedText || "No Text Available",
  };
};

export default renderEmail;
