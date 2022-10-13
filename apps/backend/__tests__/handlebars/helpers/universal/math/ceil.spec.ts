import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/ceil";

beforeEach(() => {
  handlebars.registerHelper("ceil", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() => handlebars.compile(`{{ ceil "Courier"}}`)({})).toThrowError(
    TypeError
  );
});

it("should return the ceiling value of an input", () => {
  expect(handlebars.compile(`{{ ceil 1.25}}`)({})).toBe("2");
});
