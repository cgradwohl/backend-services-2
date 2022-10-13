import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/abs";

beforeEach(() => {
  handlebars.registerHelper("abs", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() => handlebars.compile(`{{ abs "Courier"}}`)({})).toThrowError(
    TypeError
  );
});

it("should return the absolute value of an input", () => {
  expect(handlebars.compile(`{{ abs -1}}`)({})).toBe("1");
});
