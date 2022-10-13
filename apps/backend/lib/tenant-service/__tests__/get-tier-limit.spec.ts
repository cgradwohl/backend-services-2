import getTierLimit from "~/lib/tenant-service/get-tier-limit";

describe("standard pricing", () => {
  const tiers = [
    {
      flat_amount: null,
      flat_amount_decimal: null,
      unit_amount: 0,
      unit_amount_decimal: "0",
      up_to: 10000,
    },
    {
      flat_amount: 9900,
      flat_amount_decimal: "9900",
      unit_amount: 0,
      unit_amount_decimal: "0",
      up_to: 250000,
    },
    {
      flat_amount: 40000,
      flat_amount_decimal: "40000",
      unit_amount: 0,
      unit_amount_decimal: "0",
      up_to: 1000000,
    },
    {
      flat_amount: null,
      flat_amount_decimal: null,
      unit_amount: null,
      unit_amount_decimal: "0.0006",
      up_to: null,
    },
  ];

  [
    { 0: 10000 },
    { 500: 10000 },
    { 10000: 10000 },
    { 10001: 250000 },
    { 250000: 250000 },
    { 250001: 1000000 },
    { 1000000: 1000000 },
    { 1000001: 1000000 },
  ].forEach((testCase) => {
    it("should extract expected tier", () => {
      const currentPeriodUsage = Object.keys(testCase)[0];
      const expected = testCase[currentPeriodUsage];
      expect(getTierLimit(tiers, parseInt(currentPeriodUsage, 10), 0)).toBe(
        expected
      );
    });
  });

  it("should return increased tier if prior billing period was than current tier", () => {
    expect(getTierLimit(tiers, 500, 1500000)).toBe(1000000);
  });
});

describe("non-standard pricing", () => {
  const tiers = [
    {
      flat_amount: null,
      flat_amount_decimal: null,
      unit_amount: 0,
      unit_amount_decimal: "0",
      up_to: 10000000,
    },
    {
      flat_amount: null,
      flat_amount_decimal: null,
      unit_amount: null,
      unit_amount_decimal: "0.038922",
      up_to: null,
    },
  ];

  [{ 0: 10000000 }, { 10000000: 10000000 }, { 10000001: 10000000 }].forEach(
    (testCase) => {
      it("should extract expected tier", () => {
        const currentPeriodUsage = Object.keys(testCase)[0];
        const expected = testCase[currentPeriodUsage];
        expect(getTierLimit(tiers, parseInt(currentPeriodUsage, 10), 0)).toBe(
          expected
        );
      });
    }
  );
});

describe("no tier information", () => {
  it("should handle an empty array", () => {
    expect(getTierLimit([], 1000, 0)).toBe(0);
  });

  it("should handle a null array", () => {
    expect(getTierLimit(null, 1000, 0)).toBe(0);
  });
});
