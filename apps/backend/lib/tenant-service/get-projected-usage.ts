import differenceInCalendarDays from "date-fns/differenceInCalendarDays";

type GetProjectedUsageFn = (
  currentPeriodStart: number,
  currentPeriodEnd: number,
  currentPeriodUsage: number
) => number;

const getProjectedUsage: GetProjectedUsageFn = (
  currentPeriodStart,
  currentPeriodEnd,
  currentPeriodUsage
) => {
  const daysSinceStart =
    differenceInCalendarDays(new Date(), currentPeriodStart) || 1;
  const avgSentPerDay = Math.ceil(currentPeriodUsage / daysSinceStart);
  const totalDays = differenceInCalendarDays(
    currentPeriodEnd,
    currentPeriodStart
  );

  return totalDays * avgSentPerDay;
};

export default getProjectedUsage;
