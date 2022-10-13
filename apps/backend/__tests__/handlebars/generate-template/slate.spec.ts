import getHandlebarsFromSlate from "~/handlebars/template/slate";

import fixtures from "../__fixtures__";

const { slate: slateFixtures } = fixtures;

describe("generateTemplateFromSlate", () => {
  it("should generate a handlebars template from slate bold, italic, and underline", () => {
    expect(
      getHandlebarsFromSlate(slateFixtures.slateBoldItalicUnderline)
    ).toMatchInlineSnapshot(
      `"Some {{#>bold}}bold{{/bold}}, {{#>italic}}italic{{/italic}}, and {{#>underlined}}underlined{{/underlined}} text."`
    );
  });

  it("should generate a handlebars template from slate marks", () => {
    expect(
      getHandlebarsFromSlate(slateFixtures.slateItalicAroundBoldSlate)
    ).toMatchInlineSnapshot(
      `"This {{#>italic}}is {{/italic}}{{#>bold}}{{#>italic}}a{{/italic}}{{/bold}} test"`
    );
  });

  it("should generate a handlebars template from a slate variable", () => {
    expect(
      getHandlebarsFromSlate(slateFixtures.slateVariable)
    ).toMatchInlineSnapshot(`"This is a {{inline-var \\"variable\\"}}."`);
  });

  it("should generate a handlebars template from a slate link", () => {
    expect(
      getHandlebarsFromSlate(slateFixtures.slateLink)
    ).toMatchInlineSnapshot(
      `"Click {{#>link (params href=\\"https://example.com/link\\")}}this link{{/link}} to learn more."`
    );
  });

  it("should generate a handlebars template from a slate link with vars", () => {
    expect(
      getHandlebarsFromSlate(slateFixtures.slateLinkWithVars)
    ).toMatchInlineSnapshot(
      `"Link to {{#>link (params href=(concat \\"https://\\" (var \\"domain\\") \\"/\\" (var \\"user\\") \\"/\\"))}}{{inline-var \\"firstname\\"}}{{concat \\"'s \\"}}{{inline-var \\"project\\"}}{{/link}}"`
    );
  });

  it("should generate a handlebars template from slate text with scary chars", () => {
    expect(
      getHandlebarsFromSlate(slateFixtures.slateScaryChars)
    ).toMatchInlineSnapshot(
      `"{{concat (parse-string \\"Scary characters are \\\\\\", ', <, >, &, \`, =, {, and }\\")}}"`
    );
  });

  it("should generate a handlebars template from slate text with new lines", () => {
    expect(
      getHandlebarsFromSlate(slateFixtures.slateNewLines)
    ).toMatchInlineSnapshot(`"Line 1{{>br}}Line 2{{>br}}{{>br}}Line 4"`);
  });
});
