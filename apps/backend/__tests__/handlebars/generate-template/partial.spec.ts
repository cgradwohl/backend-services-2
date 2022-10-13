import getHandlebarsPartial from "~/handlebars/template/generation/get-handlebars-partial";

describe("generateTemplatePartial", () => {
  it("should generate a handlebars partial", () => {
    expect(getHandlebarsPartial("test")).toMatchInlineSnapshot(`"{{>test}}"`);
  });

  it("should generate a handlebars partial with hash properties", () => {
    expect(
      getHandlebarsPartial("test", {
        params: {
          a: null,
          b: undefined,
          c: true,
          d: 123.456,
          e: "string",
          f: [1, 2, 3],
          g: { object: true },
        },
      })
    ).toMatchInlineSnapshot(
      `"{{>test (params a=null c=true d=123.456 e=\\"string\\" f=(json-parse \\"[1,2,3]\\") g=(json-parse (parse-string \\"{\\\\\\"object\\\\\\":true}\\")))}}"`
    );
  });

  it("should generate a handlebars partial block when passed child content", () => {
    expect(
      getHandlebarsPartial("test", {
        children: "child content",
      })
    ).toMatchInlineSnapshot(`"{{#>test}}child content{{/test}}"`);
  });

  it("should generate a handlebars partial block with hash parameters", () => {
    expect(
      getHandlebarsPartial("test", {
        children: "child content here",
        params: { thisIsATest: true },
      })
    ).toMatchInlineSnapshot(
      `"{{#>test (params thisIsATest=true)}}child content here{{/test}}"`
    );
  });
});
