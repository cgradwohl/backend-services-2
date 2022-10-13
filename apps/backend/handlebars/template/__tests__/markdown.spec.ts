import getMarkdownHandlebarsTemplate from "../markdown";
import createVariableHandler from "~/lib/variable-handler";
import createLinkHandler from "~/lib/link-handler";

const templateString =
  '{{#>courier-template}}{{#*inline "courier-head-content"}}{{>courier-email-head (params brandEnabled=true children="{{#>paragraph-block}}{{#>bold}}hello{{/bold}}{{/paragraph-block}}" showCourierFooter=true)}}{{/inline}}{{#*inline "courier-header-content"}}{{>courier-email-header}}{{/inline}}{{#courier-block "adhoc-text-12b94c0d13c8bc647564a517a494183e"}}{{#>text-block}}{{#>paragraph-block}}{{#>bold}}hello{{/bold}}{{/paragraph-block}}{{/text-block}}{{/courier-block}}{{#*inline "courier-footer-content"}}{{#>courier-email-footer (params showCourierFooter=true tenantId="768251cf-3eb8-426a-92eb-faa0e7678768")}}{{/courier-email-footer}}{{/inline}}{{/courier-template}}';
describe("getMarkdownHandlebarsTemplate", () => {
  test("normal markdown", () => {
    const linkHandler = createLinkHandler({});
    const variableHandler = createVariableHandler({
      value: {},
    });

    const result = getMarkdownHandlebarsTemplate(templateString).render(
      variableHandler,
      linkHandler
    );
    expect(result).toBe(`*hello*\n`);
  });

  test("ghflavor markdown", () => {
    const linkHandler = createLinkHandler({});
    const variableHandler = createVariableHandler({
      value: {},
    });

    const result = getMarkdownHandlebarsTemplate(
      templateString,
      "github"
    ).render(variableHandler, linkHandler);
    expect(result).toBe(`**hello**\n`);
  });
});
