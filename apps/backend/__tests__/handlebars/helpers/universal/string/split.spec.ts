import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/string/split";

beforeEach(() => {
  handlebars.registerHelper("split", helper);
});

it("should split string", () => {
  const template = `{{ split input delimeter }}`;
  expect(
    handlebars.compile(template)({
      input: "courier",
    })
  ).toBe("c,o,u,r,i,e,r");
});

it("should split string with alternate delimiter", () => {
  const template = `{{ split input delimeter }}`;
  expect(
    handlebars.compile(template)({
      delimeter: " ",
      input: "try courier",
    })
  ).toBe("try,courier");
});

it("should split string and use array accessor", () => {
  const template = `{{ lookup (split input delimeter) 0 }}`;
  expect(
    handlebars.compile(template)({
      delimeter: " ",
      input: "try courier",
    })
  ).toBe("try");
});
