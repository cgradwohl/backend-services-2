import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/subtract";

beforeEach(() => {
  handlebars.registerHelper("subtract", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() =>
    handlebars.compile(`{{ subtract "Courier" 1}}`)({})
  ).toThrowError(TypeError);
  expect(() =>
    handlebars.compile(`{{ subtract 1 "Courier"}}`)({})
  ).toThrowError(TypeError);
});

it("should return the result of subtracting one value from another", () => {
  expect(handlebars.compile(`{{ subtract 8 5 }}`)({})).toBe("3");
});
