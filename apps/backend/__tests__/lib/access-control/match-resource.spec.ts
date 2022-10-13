import matchResource from "~/lib/access-control/match-resource";

describe("matches", () => {
  [
    ["*", "12345"],
    ["production/12345", "production/12345"],
    ["production/*", "production/12345"],
  ].forEach(([match, resource]) => {
    it(`should match: "${match}`, () => {
      expect(matchResource([match], resource)).toBe(true);
    });
  });
});

describe("does not match", () => {
  [["test/*", "production/12345"]].forEach(([match, resource]) => {
    it(`should not match: "${match}`, () => {
      expect(matchResource([match], resource)).toBe(false);
    });
  });
});
