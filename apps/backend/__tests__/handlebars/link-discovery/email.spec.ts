import getProviderTemplate from "~/handlebars/template";
import { TemplateConfig } from "~/handlebars/template/types";
import hydrateBlock from "~/lib/blocks/hydrate-slate-block";
import createLinkHandler, { ILinkData } from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";

import fixtures from "../__fixtures__";
import mockData from "../template/util/mock-data";
import mockProfile from "../template/util/mock-profile";
import getTrackingHandler from "./util/get-tracking-handler";

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

const { blocks: blockFixtures, templates: templateFixtures } = fixtures;

const hydrateBlocks = (blocks: any[]) => blocks.map(hydrateBlock);

describe("email blocks", () => {
  const testBlocks = [
    "actionBlock",
    "actionBlockLink",
    "actionBlockWebhook",
    "imageBlock",
    "imageBlockWithVars",
    "listBlockImagesWithLinks",
    "quoteBlockWithLink",
    "templateBlockWithLinks",
    "textBlockWithLink",
    "textBlockWithLinks",
  ];

  const only = false; // "actionBlock";

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
        isEmail: true,
      });
      const emailTemplate = template.emailRenderer();
      const data = {
        data: mockData,
        profile: mockProfile,
        urls: { opened: "https://abc.ct0.app/o/open-tracking" },
      };
      const links: { [context: string]: ILinkData } = {};
      const trackingHandler = getTrackingHandler(links);
      const variableHandler = createVariableHandler({ value: data }).getScoped(
        "data"
      );
      const linkHandler = createLinkHandler(links, true, true, trackingHandler);
      emailTemplate.render(variableHandler, linkHandler);
      expect(links).toMatchSnapshot();
    });
  });
});

describe("email templates", () => {
  const testTemplates = [
    "emailLineTemplateWithHeaderLogo",
    "emailLineTemplateWithFooterLinks",
  ];

  const only = false; // "emailLineTemplateWithFooterTextSocialLinks";

  const allBlocks = hydrateBlocks(blockFixtures.textBlock);
  const channelBlockIds = allBlocks.map((block) => block.id);

  beforeEach(() => (usingTemplate = true));

  testTemplates.forEach((templateName) => {
    const fn = only && only === templateName ? it.only : it;

    fn(`should render ${templateName}`, () => {
      const fixture = templateFixtures[templateName];
      const config = { email: fixture.email };
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
      const links: { [context: string]: ILinkData } = {};
      const trackingHandler = getTrackingHandler(links);
      const variableHandler = createVariableHandler({ value: data }).getScoped(
        "data"
      );
      const linkHandler = createLinkHandler(links, true, true, trackingHandler);
      emailTemplate.render(variableHandler, linkHandler);
      expect(links).toMatchSnapshot();
    });
  });
});
