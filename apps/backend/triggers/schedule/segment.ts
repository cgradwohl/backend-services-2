import { Context, ScheduledEvent } from "aws-lambda";
import { DynamoDB, Lambda } from "aws-sdk";
import { utcToZonedTime } from "date-fns-tz";
import eachDayOfInterval from "date-fns/eachDayOfInterval";
import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";
import sub from "date-fns/sub";
import chunkArray from "~/lib/chunk-array";

import {
  batchGet as getUsageForInterval,
  getDay,
} from "~/lib/daily-metrics-service";
import { IDailyMetrics } from "~/lib/daily-metrics-service/types";
import logger from "~/lib/logger";
import { sendGroupEvent } from "~/lib/segment";
import { get as getTenant } from "~/lib/tenant-service";
import { ITenant } from "~/types.api";

const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY;

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends ScheduledEvent {
  exclusiveStartKey?: DynamoDB.DocumentClient.Key;
  runForDay?: string;
}

const getCurrentPeriodUsage = async (tenant: ITenant) => {
  const tenantId = tenant.tenantId;

  // fall back to start and end of month if stripe information is not available
  // this should _really_ only happen in environments that are not connected
  // to stripe (eg: development). though, due to the asynchronous nature
  // of the connection to stripe, it is _possible_ that a tenant/user
  // might hit this page before all data has been created.
  const currentPeriodEnd =
    tenant.stripeCurrentPeriodEnd || endOfMonth(Date.now()).getTime();
  const currentPeriodStart =
    tenant.stripeCurrentPeriodStart || startOfMonth(Date.now()).getTime();

  const days = eachDayOfInterval({
    end: currentPeriodEnd,
    start: currentPeriodStart,
  });

  const keys = days.reduce((acc, date) => {
    return [
      ...acc,
      {
        day: format(date, "yyyy-MM-dd"),
        tenantId,
      },
      {
        day: format(date, "yyyy-MM-dd"),
        tenantId: `${tenantId}/test`,
      },
    ];
  }, []);

  let entries: IDailyMetrics[] = [];
  const chunkSize = 100;

  for (const chunkedKeys of chunkArray(keys, chunkSize)) {
    entries.push(...(await getUsageForInterval(...chunkedKeys)));
  }

  return entries.reduce((acc, entry) => {
    if (!entry.metrics.sent) {
      return acc;
    }
    return acc + entry.metrics.sent;
  }, 0);
};

const processTenant = async (tenant: ITenant) => {
  const currentPeriodUsage = await getCurrentPeriodUsage(tenant);

  const traits = {
    createdAt: new Date(tenant.created),
    current_period_usage: currentPeriodUsage,
    groupType: "Company",
    name: tenant.name,
    notification_send_count: tenant.usageActual,
    notification_send_last_at: new Date(tenant.notificationLastSentAt),
    tenant_id: tenant.tenantId,
  };

  await sendGroupEvent({
    groupId: tenant.tenantId,
    traits,
    // no choice but to pass a user Id to the segment consumer
    // passing the owner with a fallback to creator
    userId: tenant.owner || tenant.creator,
  });
};

const getQueryDay = (event: IEvent) => {
  if (event.runForDay) {
    return event.runForDay;
  }

  const todayZoned = utcToZonedTime(Date.now(), "America/Los_Angeles");
  const yesterdayZoned = sub(todayZoned, { days: 1 });
  return format(yesterdayZoned, "yyyy-MM-dd");
};

export const handler = async (event: IEvent, context: Context) => {
  if (!SEGMENT_WRITE_KEY) {
    logger.warn("SEGMENT_WRITE_KEY not detected. Job will not run.");
    return;
  }

  const { items, lastEvaluatedKey } = await getDay(
    getQueryDay(event),
    event.exclusiveStartKey
  );

  if (lastEvaluatedKey) {
    await lambda
      .invoke({
        FunctionName: context.functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          exclusiveStartKey: lastEvaluatedKey,
        }),
      })
      .promise();
  }

  await Promise.all(
    items.map(async (item) => {
      try {
        const { tenantId } = item;
        const tenant = await getTenant(tenantId);
        await processTenant(tenant);
      } catch (err) {
        logger.error(err);
        // do not throw error; keep processing rows
      }
    })
  );
};
