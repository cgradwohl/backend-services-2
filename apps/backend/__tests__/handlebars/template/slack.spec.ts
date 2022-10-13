import getProviderTemplate from "~/handlebars/template";
import { TemplateConfig } from "~/handlebars/template/types";
import hydrateBlock from "~/lib/blocks/hydrate-slate-block";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { ITextBlock } from "~/types.api";

import fixtures from "../__fixtures__";
import mockData from "./util/mock-data";
import mockProfile from "./util/mock-profile";

const { blocks: blockFixtures, slate: slateFixtures } = fixtures;

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

const hydrateBlocks = (blocks: any[]) => blocks.map(hydrateBlock);

describe("slack template blocks", () => {
  const testBlocks = [
    "textBlockHeader",
    "textBlock",
    "actionBlock",
    "actionBlockLink",
    "actionBlockWebhook",
    "conditionalTextBlock",
    "conditionalTextBlockShown",
    "dividerBlock",
    "dividerBlockWithColor",
    "imageBlock",
    "imageBlockWithVars",
    "imageBlockWithFullAlign",
    "jsonnetBlock",
    "jsonnetBlockArray",
    "listBlock",
    "listBlockBulletsEmpty",
    "listBlockWithChildren",
    "listBlockBullets",
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

  const only = false; // "jsonnetBlock";

  beforeEach(() => (usingTemplate = false));

  testBlocks.forEach((block) => {
    const fn = only && only === block ? it.only : it;

    fn(`should render ${block}`, () => {
      const allBlocks = hydrateBlocks(blockFixtures[block]);
      const channelBlockIds = allBlocks.map((block) => block.id);
      const config: TemplateConfig = { email: { emailTemplateConfig: {} } };
      const template = getProviderTemplate({
        allBlocks,
        channelBlockIds,
        config,
        provider: "slack",
      });
      const slackTemplate = template.slackRenderer();
      const data = {
        data: mockData,
        event: "mockEvent",
        profile: mockProfile,
        recipient: "mockRecipient",
        urls: { opened: "https://abc.ct0.app/o/open-tracking" },
      };
      const rendered = slackTemplate.render(
        createVariableHandler({ value: data }).getScoped("data"),
        createLinkHandler({})
      );
      expect(rendered).toMatchSnapshot();
    });
  });
});

describe("slack slate", () => {
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
      const config: TemplateConfig = {};
      const template = getProviderTemplate({
        allBlocks,
        channelBlockIds,
        config,
      });
      const slackTemplate = template.slackRenderer();
      const data = {
        data: mockData,
        profile: mockProfile,
        urls: { opened: "https://abc.ct0.app/o/open-tracking" },
      };
      const rendered = slackTemplate.render(
        createVariableHandler({ value: data }).getScoped("data"),
        createLinkHandler({})
      );
      expect(rendered).toMatchSnapshot();
    });
  });
});
