import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/mod";

beforeEach(() => {
  handlebars.registerHelper("mod", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() => handlebars.compile(`{{ mod "Courier" 1}}`)({})).toThrowError(
    TypeError
  );
  expect(() => handlebars.compile(`{{ mod 1 "Courier"}}`)({})).toThrowError(
    TypeError
  );
});

it("should return the remainder of dividing one number by another", () => {
  expect(handlebars.compile(`{{ mod 8 3 }}`)({})).toBe("2");
});
