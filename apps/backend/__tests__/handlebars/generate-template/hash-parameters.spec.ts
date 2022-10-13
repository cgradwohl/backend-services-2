import getHandlebarsHashParameters from "~/handlebars/template/generation/get-handlebars-hash-parameters";

describe("generateTemplateHashParameters", () => {
  it("should be able to handle undefined", () => {
    expect(getHandlebarsHashParameters(undefined)).toMatchInlineSnapshot(`""`);
  });

  it("should remove undefined values", () => {
    expect(
      getHandlebarsHashParameters({ isUndefined: undefined })
    ).toMatchInlineSnapshot(`""`);
  });

  it("should be able to handle null", () => {
    expect(getHandlebarsHashParameters(null)).toMatchInlineSnapshot(`""`);
  });

  it("should generate a hash value for null", () => {
    expect(getHandlebarsHashParameters({ isNull: null })).toMatchInlineSnapshot(
      `" isNull=null"`
    );
  });

  it("should generate a hash value for boolean", () => {
    expect(
      getHandlebarsHashParameters({ isBoolean: true })
    ).toMatchInlineSnapshot(`" isBoolean=true"`);
  });

  it("should generate a hash value for number", () => {
    expect(
      getHandlebarsHashParameters({ isNumber: 123.456 })
    ).toMatchInlineSnapshot(`" isNumber=123.456"`);
  });

  it("should generate a hash value for string", () => {
    expect(
      getHandlebarsHashParameters({ isString: "test" })
    ).toMatchInlineSnapshot(`" isString=\\"test\\""`);
  });

  it("should generate a hash value for array", () => {
    expect(
      getHandlebarsHashParameters({ isArray: [1, 2, 3] })
    ).toMatchInlineSnapshot(`" isArray=(json-parse \\"[1,2,3]\\")"`);
  });

  it("should generate a hash value for object", () => {
    expect(
      getHandlebarsHashParameters({ isObject: { object: true } })
    ).toMatchInlineSnapshot(
      `" isObject=(json-parse (parse-string \\"{\\\\\\"object\\\\\\":true}\\"))"`
    );
  });
});
