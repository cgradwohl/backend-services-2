import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/multiply";

beforeEach(() => {
  handlebars.registerHelper("multiply", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() =>
    handlebars.compile(`{{ multiply "Courier" 1}}`)({})
  ).toThrowError(TypeError);
  expect(() =>
    handlebars.compile(`{{ multiply 1 "Courier"}}`)({})
  ).toThrowError(TypeError);
});

it("should return the result of multiplying two values", () => {
  expect(handlebars.compile(`{{ multiply 8 5 }}`)({})).toBe("40");
});
