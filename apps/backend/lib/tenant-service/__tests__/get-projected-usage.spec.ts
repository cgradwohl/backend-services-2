import { addDays, subDays } from "date-fns";
import getProjectedUsage from "~/lib/tenant-service/get-projected-usage";

it("should calculate projection for current period", () => {
  const currentPeriodUsage = 100;
  const currentPeriodStart = subDays(Date.now(), 10).getTime();
  const currentPeriodEnd = addDays(Date.now(), 20).getTime();

  expect(
    getProjectedUsage(currentPeriodStart, currentPeriodEnd, currentPeriodUsage)
  ).toBe(300); // 10 per day times 30 days
});

it("should zero current usage", () => {
  const currentPeriodUsage = 0;
  const currentPeriodStart = subDays(Date.now(), 10).getTime();
  const currentPeriodEnd = addDays(Date.now(), 20).getTime();

  expect(
    getProjectedUsage(currentPeriodStart, currentPeriodEnd, currentPeriodUsage)
  ).toBe(0);
});

it("should handle today being the start date", () => {
  const currentPeriodUsage = 100;
  const currentPeriodStart = Date.now();
  const currentPeriodEnd = addDays(Date.now(), 30).getTime();

  expect(
    getProjectedUsage(currentPeriodStart, currentPeriodEnd, currentPeriodUsage)
  ).toBe(3000); // 100 times a day for 30 days
});

it("should handle today being the end date", () => {
  const currentPeriodUsage = 3000;
  const currentPeriodStart = subDays(Date.now(), 30).getTime();
  const currentPeriodEnd = Date.now();

  expect(
    getProjectedUsage(currentPeriodStart, currentPeriodEnd, currentPeriodUsage)
  ).toBe(3000); // 100 times a day for 30 days
});
