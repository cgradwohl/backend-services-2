import axios from "axios";
import getUnixTime from "date-fns/getUnixTime";
import makeError from "make-error";

import assertIsDefined from "../assertions/is-defined";
import logger from "~/lib/logger";
import {
  CreateMetricFn,
  HttpPostFn,
  IncrementFn,
  MetricHandlerFn,
} from "./types";

const {
  DD_API_HOST = "https://api.datadoghq.com",
  DD_API_KEY,
  STAGE,
} = process.env;

const GLOBAL_TAGS = [`environment:${STAGE}`];

const MetricNameTooLongError = makeError("MetricNameTooLongError");
const createMetric: CreateMetricFn = (tenantId, metric, options) => {
  if (metric.length > 20) {
    throw new MetricNameTooLongError();
  }

  const tags = [...(options?.tags || []), ...GLOBAL_TAGS, `tenant:${tenantId}`];
  const timestamp = options?.timestamp || getUnixTime(Date.now());
  const value = options?.value || 1;

  return {
    interval: options?.interval,
    metric,
    points: [[timestamp, value]],
    tags,
    type: "count",
  };
};

const httpPost: HttpPostFn = async (request) => {
  if (!DD_API_KEY) {
    logger.debug("DD_API_KEY not found. Request will not be sent.", request);
    return;
  }

  assertIsDefined(DD_API_HOST, "DD_API_HOST");

  logger.debug("Datadog: Custom Metric", { series: request.series });
  await axios.post<undefined>(
    `${DD_API_HOST}/api/v1/series?api_key=${DD_API_KEY}`,
    { series: request.series }
  );
};

const metricHandler: MetricHandlerFn = (fn) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      logger.error("Error capturing datadog metrics", err);
    }
  };
};

export const incrementMetric = metricHandler<IncrementFn>(
  async (tenantId, metric, options) => {
    // temp short circuit coz we're not being able to write to DD
    return;
    // TODO: uncomment the code below once we get rid of the above return
    // const metrics = Array.isArray(metric) ? metric : [metric];
    // const series = [];

    // for (const key of metrics) {
    //   try {
    //     series.push(
    //       createMetric(tenantId, key, {
    //         interval: options?.interval,
    //         tags: options?.tags,
    //         timestamp: options?.timestamp,
    //         type: "count",
    //         value: options?.value,
    //       })
    //     );
    //   } catch (err) {
    //     if (err instanceof MetricNameTooLongError) {
    //       warn(`${metric}: Metric omitted. Length greater than 20 characters.`);
    //       continue;
    //     }
    //     throw err;
    //   }
    // }

    // await httpPost({ series });
  }
);
