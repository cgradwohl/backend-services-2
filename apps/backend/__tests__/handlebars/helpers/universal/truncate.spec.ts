import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/truncate";

beforeEach(() => {
  handlebars.registerHelper("truncate", helper);
});

it("should not truncate a string shorter than the limit", () => {
  const input = "some long string";
  const limit = 50;
  expect(
    handlebars.compile(`{{ truncate input limit }}`)({ input, limit })
  ).toBe(input);
});

it("should not truncate a string exactly than the limit", () => {
  const input = "some long string";
  const limit = input.length;
  expect(
    handlebars.compile(`{{ truncate input limit }}`)({ input, limit })
  ).toBe(input);
});

it("should truncate a string longer than the limit", () => {
  const input = "some long string";
  const limit = 4;
  expect(
    handlebars.compile(`{{ truncate input limit }}`)({ input, limit })
  ).toBe("some");
});

it("should truncate a string longer than the limit and append suffix", () => {
  const input = "some long string";
  const limit = 4;
  const suffix = "...";
  expect(
    handlebars.compile(`{{ truncate input limit suffix }}`)({
      input,
      limit,
      suffix,
    })
  ).toBe("some...");
});
