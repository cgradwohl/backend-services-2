import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/math/add";

beforeEach(() => {
  handlebars.registerHelper("add", helper);
});

it("should throw an error if the input is not a number", () => {
  expect(() => handlebars.compile(`{{ add "Courier" 1}}`)({})).toThrowError(
    TypeError
  );
  expect(() => handlebars.compile(`{{ add 1 "Courier"}}`)({})).toThrowError(
    TypeError
  );
});

it("should return the result of adding one value to another", () => {
  expect(handlebars.compile(`{{ add 8 5 }}`)({})).toBe("13");
});
