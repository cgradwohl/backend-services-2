import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/capitalize";

beforeEach(() => {
  handlebars.registerHelper("capitalize", helper);
});

[
  { input: "courier", output: "Courier" },
  { input: "try courier", output: "Try courier" },
].forEach(({ input, output }) => {
  it(`should capitalize "${input}"`, () => {
    expect(handlebars.compile(`{{ capitalize input}}`)({ input })).toBe(output);
  });
});
