import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/format";

beforeEach(() => {
  handlebars.registerHelper("format", helper);
});

[
  { args: "100", fmt: "%.2f", output: "100.00" },
  {
    args: ["42", "life"],
    fmt: "%d is the answer to %s",
    output: "42 is the answer to life",
  },
].forEach(({ fmt, args, output }) => {
  it(`should format "${fmt}"`, () => {
    expect(handlebars.compile(`{{ format fmt args}}`)({ fmt, args })).toBe(
      output
    );
  });
});
