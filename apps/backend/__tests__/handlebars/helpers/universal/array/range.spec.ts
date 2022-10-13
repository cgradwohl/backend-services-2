import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/array/range";

beforeEach(() => {
  handlebars.registerHelper("range", helper);
});

it("generate range with only stop specified", () => {
  expect(handlebars.compile("{{ range 4 }}")({})).toBe("0,1,2,3");
});

it("generate range with start and stop specified", () => {
  expect(handlebars.compile("{{ range 1 5 }}")({})).toBe("1,2,3,4");
});

it("generate range with start, step, and stop specified", () => {
  expect(handlebars.compile("{{ range 0 20 5 }}")({})).toBe("0,5,10,15");
});

it("should generate no range", () => {
  expect(handlebars.compile("{{ range 0 }}")({})).toBe("");
});

it("should generate negative range", () => {
  expect(handlebars.compile("{{ range 0 -5 -1 }}")({})).toBe("0,-1,-2,-3,-4");
});
