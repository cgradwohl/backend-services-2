import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/round";

beforeEach(() => {
  handlebars.registerHelper("round", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() => handlebars.compile(`{{ round "Courier"}}`)({})).toThrowError(
    TypeError
  );
});

it("should return the rounded value of an input", () => {
  expect(handlebars.compile(`{{ round 1.25}}`)({})).toBe("1");
  expect(handlebars.compile(`{{ round 1.75}}`)({})).toBe("2");
});
