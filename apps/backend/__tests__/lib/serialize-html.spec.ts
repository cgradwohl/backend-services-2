import createLinkHandler from "~/lib/link-handler";
import serializeHtml from "../../lib/serialize-html";
import serializeTestValues from "./serialize-test-values";

const variableReplacer = (stringValue: string) => stringValue;
const linkHandler = createLinkHandler({});

describe("serializeHtml", () => {
  it("should serialize plain text", () => {
    expect(
      serializeHtml(serializeTestValues.text, linkHandler, variableReplacer)
    ).toMatchInlineSnapshot(`"plain text"`);
  });

  it("should render bold", () => {
    expect(
      serializeHtml(serializeTestValues.bold, linkHandler, variableReplacer)
    ).toMatchInlineSnapshot(`"This is a <strong>bold</strong> value."`);
  });

  it("should render bold", () => {
    expect(
      serializeHtml(serializeTestValues.bold, linkHandler, variableReplacer)
    ).toMatchInlineSnapshot(`"This is a <strong>bold</strong> value."`);
  });

  it("should render italic", () => {
    expect(
      serializeHtml(serializeTestValues.italic, linkHandler, variableReplacer)
    ).toMatchInlineSnapshot(`"This is an <em>italic</em> value."`);
  });

  it("should render underline", () => {
    expect(
      serializeHtml(
        serializeTestValues.underline,
        linkHandler,
        variableReplacer
      )
    ).toMatchInlineSnapshot(`"This is an <u>underlined</u> value."`);
  });

  it("should render link", () => {
    expect(
      serializeHtml(serializeTestValues.link, linkHandler, variableReplacer)
    ).toMatchInlineSnapshot(
      `"This is a <a href=\\"https:\/\/example.com\\">link</a> value."`
    );
  });

  it("should render multiple lines", () => {
    expect(
      serializeHtml(
        serializeTestValues.multiline,
        linkHandler,
        variableReplacer
      )
    ).toMatchInlineSnapshot(`"First line.<br>Second line."`);
  });
});
