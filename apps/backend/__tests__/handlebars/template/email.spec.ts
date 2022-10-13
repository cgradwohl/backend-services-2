import getProviderTemplate from "~/handlebars/template";
import getTemplateOverrides from "~/handlebars/template/get-template-overrides";
import { TemplateConfig } from "~/handlebars/template/types";
import hydrateBlock from "~/lib/blocks/hydrate-slate-block";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { EmailTemplateConfig, ITextBlock } from "~/types.api";

import fixtures from "../__fixtures__";
import mockData from "./util/mock-data";
import mockProfile from "./util/mock-profile";

const {
  blocks: blockFixtures,
  slate: slateFixtures,
  templates: templateFixtures,
} = fixtures;

// have the mjml module just return the mjml instead of rendering
jest.mock("mjml", () => {
  return {
    __esModule: true,
    default: (mjml) => ({ errors: [], html: mjml }),
  };
});

let usingTemplate = false;
jest.mock("~/handlebars/partials", () => {
  const partials = jest.requireActual("~/handlebars/partials");
  const courierTemplate = partials.default.email["courier-template"];

  // going to dynamically render the template based on usingTemplate
  Object.defineProperty(partials.default.email, "courier-template", {
    get: () => (usingTemplate ? courierTemplate : undefined),
  });

  return partials;
});

jest.mock("~/lib/log", () => {
  return {
    __esModule: true,
    logReturn: (v) => v,
  };
});

const hydrateBlocks = (blocks: any[]) => blocks.map(hydrateBlock);

describe("email template blocks", () => {
  const testBlocks = [
    "textBlock",
    "textBlockBorder",
    "textBlockBorderDisabled",
    "actionBlock",
    "actionBlockLink",
    "colorVarBlocks",
    "columnBlock2Left",
    "columnBlock2Center",
    "conditionalTextBlock",
    "conditionalTextBlockShown",
    "dividerBlock",
    "dividerBlockWithColor",
    "imageBlock",
    "imageBlockWithVars",
    "imageBlockWithFullAlign",
    "jsonnetBlock",
    "listBlock",
    "listBlockWithChildren",
    "listBlockBullets",
    "listBlockBulletsEmpty",
    "listBlockBulletsWithChildren",
    "listBlockTransparent",
    "listBlockTransparentWithChildren",
    "listBlockTransparentWithTopImage",
    "listBlockTransparentWithChildImage",
    "listBlockTransparentWithChildNotFound",
    "listBlockUsingObjects",
    "markdownBlock",
    "markdownBlockMultiLine",
    "markdownBlockWithBoldVariable",
    "markdownBlockWithTextWithTags",
    "markdownBlockWithVariableWithTags",
    "quoteBlockWithLink",
    "templateBlock",
    "templateBlockWithSetHelper",
    "textBlockWithLink",
    "textBlockWithMarks",
    "textBlockWithVariable",
    "textBlockWithVariableEscaping",
    "textBlockWithVariableWithLineReturns",
    "textBlockWithVariableWithWindowsLineReturns",
    "textBlockWhitespace",
    "textBlockWithLinkWithWhitespace",
    "welcomeBlocks",
  ];

  const only = false; // "markdownBlockBug";

  beforeEach(() => (usingTemplate = false));

  testBlocks.forEach((block) => {
    const fn = only && only === block ? it.only : it;

    fn(`should render ${block}`, () => {
      const fixture = blockFixtures[block];

      const allBlocks = hydrateBlocks(fixture);
      const channelBlockIds = allBlocks.map((block) => block.id);
      const config: TemplateConfig = fixture;

      const template = getProviderTemplate({
        allBlocks,
        channelBlockIds,
        config,
        isEmail: true,
      });
      const emailTemplate = template.emailRenderer();
      const data = {
        data: mockData,
        profile: mockProfile,
        urls: { opened: "https://abc.ct0.app/o/open-tracking" },
      };

      const rendered = emailTemplate.render(
        createVariableHandler({ value: data }).getScoped("data"),
        createLinkHandler({})
      );
      expect(rendered).toMatchSnapshot();
    });
  });
});

describe("email slate", () => {
  const testSlate = [
    "slateBoldItalicUnderline",
    "slateItalicAroundBoldSlate",
    "slateLink",
    "slateLinkWithVars",
    "slateNewLines",
    "slateScaryChars",
    "slateVariable",
  ];

  const only = false; // "slateBoldItalicUnderline";

  const textBlock = hydrateBlocks(blockFixtures.textBlock)[0] as ITextBlock;

  beforeEach(() => (usingTemplate = false));

  testSlate.forEach((templateName) => {
    const fn = only && only === templateName ? it.only : it;

    fn(`should render ${templateName}`, () => {
      const slateTextBlock: ITextBlock = {
        ...textBlock,
        config: {
          ...textBlock.config,
          value: slateFixtures[templateName],
        },
      };
      const allBlocks = [slateTextBlock];
      const channelBlockIds = [slateTextBlock.id];
      const emailTemplateConfig: EmailTemplateConfig =
        templateFixtures[templateName];
      const config: TemplateConfig = { email: { emailTemplateConfig } };
      const template = getProviderTemplate({
        allBlocks,
        channelBlockIds,
        config,
        isEmail: true,
      });
      const emailTemplate = template.emailRenderer();
      const data = {
        data: mockData,
        profile: mockProfile,
        urls: { opened: "https://abc.ct0.app/o/open-tracking" },
      };
      const rendered = emailTemplate.render(
        createVariableHandler({ value: data }).getScoped("data"),
        createLinkHandler({})
      );
      expect(rendered).toMatchSnapshot();
    });
  });
});

describe("email templates", () => {
  const testTemplates = [
    "emailCustomTemplate",
    "emailLineTemplateWithCustomHead",
    "emailLineTemplateWithFooterLinks",
    "emailLineTemplateWithFooterText",
    "emailLineTemplateWithFooterTextSocialLinks",
    "emailLineTemplateWithHeaderColorVar",
    "emailLineTemplateWithHeaderLogo",
    "emailMjmlTemplate",
    "emailNoneTemplate",
  ];

  const only = false; // "emailNoneTemplate";

  const allBlocks = hydrateBlocks(blockFixtures.textBlock);
  const channelBlockIds = allBlocks.map((block) => block.id);

  beforeEach(() => (usingTemplate = true));

  testTemplates.forEach((templateName) => {
    const fn = only && only === templateName ? it.only : it;

    fn(`should render ${templateName}`, () => {
      const fixture = templateFixtures[templateName];
      const config = fixture;
      const templateOverrides = getTemplateOverrides(
        config.brand?.email?.templateOverride
      );
      const template = getProviderTemplate({
        allBlocks,
        channelBlockIds,
        config,
        isEmail: true,
      });

      const emailTemplate = template.emailRenderer();
      const data = {
        data: {
          ...mockData,
          templateOverrides,
        },
        profile: mockProfile,
        templateOverrides,
        urls: { opened: "https://abc.ct0.app/o/open-tracking" },
      };
      const rendered = emailTemplate.render(
        createVariableHandler({ value: data }).getScoped("data"),
        createLinkHandler({})
      );
      expect(rendered).toMatchSnapshot();
    });
  });
});
