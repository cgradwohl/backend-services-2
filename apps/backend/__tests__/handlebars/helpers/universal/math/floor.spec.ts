import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/floor";

beforeEach(() => {
  handlebars.registerHelper("floor", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() => handlebars.compile(`{{ floor "Courier"}}`)({})).toThrowError(
    TypeError
  );
});

it("should return the floor value of an input", () => {
  expect(handlebars.compile(`{{ floor 1.75}}`)({})).toBe("1");
});
