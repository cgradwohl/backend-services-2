// TODO: Delete this file after the UI changes deploy

import KoaRouter from "koa-router";
import { getMetrics } from "../lib/elastic-search/messages";

import addDays from "date-fns/addDays";
import endOfMonth from "date-fns/endOfMonth";
import startOfMonth from "date-fns/startOfMonth";

const billing = new KoaRouter();
export const FREE_PLAN_NOTIFICATION_CAP = 10000;

billing.get("/", async (context) => {
  const { tenantId } = context.userContext;
  const firstDayOfBillingPeriod = startOfMonth(Date.now());
  const firstDayOfLastBillingPeriod = startOfMonth(
    addDays(firstDayOfBillingPeriod, -1)
  );

  const billingPeriod = {
    end: endOfMonth(firstDayOfBillingPeriod),
    start: firstDayOfBillingPeriod,
  };

  const thisMonth = await getMetrics({
    fromDate: billingPeriod.start.getTime(),
    tenantId,
    toDate: billingPeriod.end.getTime(),
  });

  const lastBillingPeriod = {
    end: endOfMonth(firstDayOfLastBillingPeriod),
    start: firstDayOfLastBillingPeriod,
  };

  const lastMonth = await getMetrics({
    fromDate: lastBillingPeriod.start.getTime(),
    tenantId,
    toDate: lastBillingPeriod.end.getTime(),
  });

  context.body = {
    billingPeriod,
    notificationCap: FREE_PLAN_NOTIFICATION_CAP,
    totalSent: thisMonth.totalHits,
    totalSentLastMonth: lastMonth.totalHits,
  };
});

export default billing;
