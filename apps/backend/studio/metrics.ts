import { eachDayOfInterval, format, parseISO } from "date-fns";
import KoaRouter from "koa-router";
import * as configurations from "../lib/configurations-service";
import { batchGet } from "~/lib/daily-metrics-service";
import { IDailyMetrics } from "~/lib/daily-metrics-service/types";
import { getMetrics } from "../lib/elastic-search/messages";

const router = new KoaRouter();

const getRange = async (context) => {
  const { request, userContext } = context;
  const { tenantId } = userContext;
  const { end, start } = request.query;

  const dates = eachDayOfInterval({
    end: parseISO(end),
    start: parseISO(start),
  });

  const keys = dates.map((date) => ({
    day: format(date, "yyyy-MM-dd"),
    tenantId,
  }));

  const data = await batchGet(...keys);

  return keys.map(
    (key) =>
      data.find(({ day }) => day === key.day) ||
      ({
        day: key.day,
        metrics: {},
      } as IDailyMetrics)
  );
};

router.get("/daily/provider", async (context) => {
  const range = await getRange(context);
  const list = await configurations.list({
    tenantId: context.userContext.tenantId,
  });

  const metrics = range.reduce((acc, entry) => {
    const { metrics } = entry;

    for (const metric in metrics) {
      if (entry.metrics[metric]) {
        const match = metric.match(/(.*)_(clicked|errors|sent)/);

        if (!match) {
          continue;
        }

        const [, provider, action] = match;

        if (!acc[provider]) {
          acc[provider] = {};
        }

        acc[provider][action] = acc[provider][action]
          ? acc[provider][action] + metrics[metric]
          : metrics[metric];
      }
    }

    return acc;
  }, {});

  list.objects.map((item) => {
    if (!Object.keys(metrics).includes(item.json.provider)) {
      metrics[item.json.provider] = { clicked: 0, errors: 0, sent: 0 };
    }
  });

  context.body = metrics;
});

router.get("/daily/status", async (context) => {
  const range = await getRange(context);
  context.body = range.reduce(
    (acc, day) => {
      acc.sent += day.metrics.sent || 0;
      acc.undeliverable += day.metrics.undeliverable || 0;
      return acc;
    },
    { sent: 0, undeliverable: 0 }
  );
});

router.get("/daily", async (context) => {
  context.body = await getRange(context);
});

router.get("/", async (context) => {
  const { tenantId } = context.userContext;
  const { fromDate, toDate, aggregations, eventId } = context.request.query;
  const result = await getMetrics({
    aggregations,
    eventId,
    fromDate,
    tenantId,
    toDate,
  });

  context.body = result;
});

export default router;
