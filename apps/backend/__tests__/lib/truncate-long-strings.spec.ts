import truncateLargeStrings from "~/lib/truncate-long-strings";

const testCases: Array<{ [key: string]: any }> = [
  { a: "afsdfasdfasdfsadfsd" },
  {
    a: [1, 2, 3, 4],
  },
  {
    a: {
      b: {
        c: "1",
        d: "2",
        e: [1, 2, 3, 4],
      },
    },
    f: 42,
  },
  {},
];

describe("when truncating large string values", () => {
  for (const testCase of testCases) {
    it("will return the original object if there are no long strings", () =>
      expect(truncateLargeStrings(testCase)).toStrictEqual(testCase));
  }
});
