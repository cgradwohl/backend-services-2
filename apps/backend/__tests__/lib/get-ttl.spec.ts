import getTtl from "~/lib/get-ttl";

const initialCases: ReadonlyArray<[number, number]> = [
  ...Array(10).keys(),
].map((i) => [i + 1, undefined]);
const rest: ReadonlyArray<[number, number]> = [
  [11, 1482366967],
  [12, 1482370567],
  [13, 1482374167],
  [14, 1482374167],
];
const testSuite: ReadonlyArray<[number, number]> = initialCases.concat(rest);

// set a hard coded date time for testing purposes
jest.spyOn(Date, "now").mockImplementation(() => 1482363367071);

describe("when getting TTL", () => {
  for (const [testCase, expected] of testSuite) {
    it(`will return ${expected} if test case is ${testCase}`, () =>
      expect(getTtl(testCase)).toBe(expected));
  }

  it("will return expected time if there is a base time override", () =>
    expect(getTtl(11, { date: 1602363367071 })).toBe(1602366967));

  it("will return expected time if there is an interval override", () =>
    expect(getTtl(1, { intervalMap: new Map([[1, 5]]) })).toBe(1482363667));
});
