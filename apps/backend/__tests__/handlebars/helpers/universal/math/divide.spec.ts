import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/divide";

beforeEach(() => {
  handlebars.registerHelper("divide", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() => handlebars.compile(`{{ divide "Courier" 1}}`)({})).toThrowError(
    TypeError
  );
  expect(() => handlebars.compile(`{{ divide 1 "Courier"}}`)({})).toThrowError(
    TypeError
  );
});

it("should return the result of dividing one number by another", () => {
  expect(handlebars.compile(`{{ divide 40 5 }}`)({})).toBe("8");
});
