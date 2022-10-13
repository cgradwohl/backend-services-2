import getProviderTemplate from "~/handlebars/template";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";

import mockData from "./util/mock-data";
import mockProfile from "./util/mock-profile";

describe("text template", () => {
  it("should render a variable", () => {
    const text = "Hello {name}";
    const template = getProviderTemplate({
      allBlocks: [],
      channelBlockIds: [],
      config: {},
    });
    const textTemplate = template.fromText(text);
    const data = {
      data: mockData,
      profile: mockProfile,
      urls: { opened: "https://abc.ct0.app/o/open-tracking" },
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );
    const rendered = textTemplate.render(
      variableHandler,
      createLinkHandler({})
    );
    expect(rendered).toEqual(variableHandler.replace(text));
    expect(rendered).toMatchInlineSnapshot(`"Hello Luke"`);
  });

  it("should render a variable with hbs", () => {
    const text = "Hello {{name}}";
    const template = getProviderTemplate({
      allBlocks: [],
      channelBlockIds: [],
      config: {},
    });
    const textTemplate = template.fromTextUnsafe(text);
    const data = {
      data: mockData,
      profile: mockProfile,
      urls: { opened: "https://abc.ct0.app/o/open-tracking" },
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );
    const rendered = textTemplate.render(
      variableHandler,
      createLinkHandler({})
    );
    expect(rendered).toMatchInlineSnapshot(`"Hello Luke"`);
  });

  it("should render swu helper a variable with hbs", () => {
    const text = 'Hello {{ swu_datetimeformat time "%a, %B %d"}}';
    const template = getProviderTemplate({
      allBlocks: [],
      channelBlockIds: [],
      config: {},
    });
    const textTemplate = template.fromTextUnsafe(text);
    const data = {
      data: mockData,
      profile: mockProfile,
      urls: { opened: "https://abc.ct0.app/o/open-tracking" },
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );
    const rendered = textTemplate.render(
      variableHandler,
      createLinkHandler({})
    );
    expect(rendered).toMatchInlineSnapshot(`"Hello Tue, February 17"`);
  });

  it("should not encode values", () => {
    const text = "Don't encode &, <, >, \", ', ` and = ";
    const template = getProviderTemplate({
      allBlocks: [],
      channelBlockIds: [],
      config: {},
    });
    const textTemplate = template.fromText(text);
    const data = {
      data: mockData,
      profile: mockProfile,
      urls: { opened: "https://abc.ct0.app/o/open-tracking" },
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );
    const rendered = textTemplate.render(
      variableHandler,
      createLinkHandler({})
    );
    expect(rendered).toEqual(variableHandler.replace(text));
    expect(rendered).toMatchInlineSnapshot(
      `"Don't encode &, <, >, \\", ', \` and = "`
    );
  });
});
