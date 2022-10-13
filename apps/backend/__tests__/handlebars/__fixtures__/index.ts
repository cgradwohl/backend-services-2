import { Value } from "slate";

import { EmailJsonParams } from "~/types.api.js";

import actionBlockLink from "./action-block-link.json";
import actionBlockWebhook from "./action-block-webhook.json";
import actionBlock from "./action-block.json";
import colorVarBlocks from "./color-var-blocks.json";
import columnBlock2Center from "./column-block-2-center.json";
import columnBlock2Left from "./column-block-2-left.json";
import conditionalTextBlockShown from "./conditional-text-block-shown.json";
import conditionalTextBlock from "./conditional-text-block.json";
import dividerBlockWithColor from "./divider-block-with-color.json";
import dividerBlock from "./divider-block.json";
import emailCustomTemplate from "./email-custom-template.json";
import emailLineTemplateWithCustomHead from "./email-line-template-with-custom-head.json";
import emailLineTemplateWithFooterLinks from "./email-line-template-with-footer-links.json";
import emailLineTemplateWithFooterTextSocialLinks from "./email-line-template-with-footer-text-social-links.json";
import emailLineTemplateWithFooterText from "./email-line-template-with-footer-text.json";
import emailLineTemplateWithHeaderColorVar from "./email-line-template-with-header-color-var.json";
import emailLineTemplateWithHeaderLogo from "./email-line-template-with-header-logo.json";
import emailMjmlTemplate from "./email-mjml-template.json";
import emailNoneTemplate from "./email-none-template.json";
import imageBlockWithFullAlign from "./image-block-with-full-align.json";
import imageBlockWithVars from "./image-block-with-vars.json";
import imageBlock from "./image-block.json";
import jsonnetBlock from "./jsonnet-block.json";
import jsonnetBlockArray from "./jsonnet-block-array.json";
import listBlockBulletsEmpty from "./list-block-bullets-empty.json";
import listBlockBulletsWithChildren from "./list-block-bullets-with-children.json";
import listBlockBullets from "./list-block-bullets.json";
import listBlockImagesWithChildren from "./list-block-images-with-children.json";
import listBlockImagesWithLinks from "./list-block-images-with-links.json";
import listBlockImages from "./list-block-images.json";
import listBlockTransparentWithChildImage from "./list-block-transparent-with-child-image.json";
import listBlockTransparentWithChildNotFound from "./list-block-transparent-with-child-not-found.json";
import listBlockTransparentWithTopImage from "./list-block-transparent-with-top-image.json";
import listBlockTransparent from "./list-block-transparent.json";
import listBlockUsingObjects from "./list-block-using-objects.json";
import listBlockTransparentWithChildren from "./list-block-with-children.json";
import listBlockWithChildren from "./list-block-with-children.json";
import listBlock from "./list-block.json";
import markdownBlockMultiLine from "./markdown-block-multi-line.json";
import markdownBlockWithBoldVariable from "./markdown-block-with-bold-variable.json";
import markdownBlockWithTextWithTags from "./markdown-block-with-text-with-tags.json";
import markdownBlockWithVariableWithTags from "./markdown-block-with-variable-with-tags.json";
import markdownBlock from "./markdown-block.json";
import quoteBlockWithLink from "./quote-block-with-link.json";
import slateBoldItalicUnderline from "./slate-bold-italic-underline.json";
import slateItalicAroundBoldSlate from "./slate-italic-around-bold.json";
import slateLinkWithVars from "./slate-link-with-vars.json";
import slateLink from "./slate-link.json";
import slateNewLines from "./slate-new-lines.json";
import slateScaryChars from "./slate-scary-chars.json";
import slateVariable from "./slate-variable.json";
import templateBlock from "./template-block.json";
import templateBlockWithLinks from "./template-block-with-links.json";
import templateBlockWithSetHelper from "./template-block-with-set-helper.json";
import textBlock from "./text-block.json";
import textBlockBorder from "./text-block-border.json";
import textBlockBorderDisabled from "./text-block-border-disabled.json";
import textBlockHeader from "./text-block-header.json";
import textBlockWhitespace from "./text-block-whitespace.json";
import textBlockWithLink from "./text-block-with-link.json";
import textBlockWithLinks from "./text-block-with-links.json";
import textBlockWithLinkWithWhitespace from "./text-block-with-link-with-whitespace.json";
import textBlockWithMarks from "./text-block-with-marks.json";
import textBlockWithVariable from "./text-block-with-variable.json";
import textBlockWithVariableEscaping from "./text-block-with-variable-escaping.json";
import textBlockWithVariableWithLineReturns from "./text-block-with-variable-with-line-returns.json";
import textBlockWithVariableWithWindowsLineReturns from "./text-block-with-variable-with-windows-line-returns.json";
import welcomeBlocks from "./welcome-blocks.json";

const blocks = {
  actionBlock,
  actionBlockLink,
  actionBlockWebhook,
  colorVarBlocks,
  columnBlock2Left,
  columnBlock2Center,
  conditionalTextBlock,
  conditionalTextBlockShown,
  dividerBlock,
  dividerBlockWithColor,
  imageBlock,
  imageBlockWithFullAlign,
  imageBlockWithVars,
  jsonnetBlock,
  jsonnetBlockArray,
  listBlock,
  listBlockBullets,
  listBlockBulletsEmpty,
  listBlockBulletsWithChildren,
  listBlockImages,
  listBlockImagesWithChildren,
  listBlockImagesWithLinks,
  listBlockTransparent,
  listBlockTransparentWithChildImage,
  listBlockTransparentWithChildNotFound,
  listBlockTransparentWithChildren,
  listBlockTransparentWithTopImage,
  listBlockUsingObjects,
  listBlockWithChildren,
  markdownBlock,
  markdownBlockMultiLine,
  markdownBlockWithBoldVariable,
  markdownBlockWithTextWithTags,
  markdownBlockWithVariableWithTags,
  quoteBlockWithLink,
  templateBlock,
  templateBlockWithLinks,
  templateBlockWithSetHelper,
  textBlock,
  textBlockBorder,
  textBlockBorderDisabled,
  textBlockHeader,
  textBlockWhitespace,
  textBlockWithLink,
  textBlockWithLinks,
  textBlockWithLinkWithWhitespace,
  textBlockWithMarks,
  textBlockWithVariable,
  textBlockWithVariableEscaping,
  textBlockWithVariableWithLineReturns,
  textBlockWithVariableWithWindowsLineReturns,
  welcomeBlocks,
};

const toSlateValue = (value: any) => Value.fromJSON(value);

const slate = {
  slateBoldItalicUnderline: toSlateValue(slateBoldItalicUnderline),
  slateItalicAroundBoldSlate: toSlateValue(slateItalicAroundBoldSlate),
  slateLink: toSlateValue(slateLink),
  slateLinkWithVars: toSlateValue(slateLinkWithVars),
  slateNewLines: toSlateValue(slateNewLines),
  slateScaryChars: toSlateValue(slateScaryChars),
  slateVariable: toSlateValue(slateVariable),
};

const toTemplateConfig = (config: any): { email: EmailJsonParams } => {
  if (!config || typeof config !== "object") {
    return { email: {} };
  }

  return {
    ...config,
    email: {
      ...config?.email,
      emailTemplateConfig: {
        ...config?.email?.emailTemplateConfig,
        footerText: config?.email?.emailTemplateConfig?.footerText
          ? toSlateValue(
              JSON.parse(config?.email?.emailTemplateConfig.footerText)
            )
          : undefined,
      },
    },
  };
};

const templates = {
  emailCustomTemplate: toTemplateConfig(emailCustomTemplate),
  emailLineTemplateWithCustomHead: toTemplateConfig(
    emailLineTemplateWithCustomHead
  ),
  emailLineTemplateWithFooterLinks: toTemplateConfig(
    emailLineTemplateWithFooterLinks
  ),
  emailLineTemplateWithFooterText: toTemplateConfig(
    emailLineTemplateWithFooterText
  ),
  emailLineTemplateWithFooterTextSocialLinks: toTemplateConfig(
    emailLineTemplateWithFooterTextSocialLinks
  ),
  emailLineTemplateWithHeaderColorVar: toTemplateConfig(
    emailLineTemplateWithHeaderColorVar
  ),
  emailLineTemplateWithHeaderLogo: toTemplateConfig(
    emailLineTemplateWithHeaderLogo
  ),
  emailMjmlTemplate: toTemplateConfig(emailMjmlTemplate),
  emailNoneTemplate: toTemplateConfig(emailNoneTemplate),
};

const fixtures = {
  blocks,
  slate,
  templates,
};

export default fixtures;
