import { MetricsLogger, Unit, createMetricsLogger } from "aws-embedded-metrics";
import { CourierLogger, CourierLoggerType } from "../logger";

export class CourierEmf {
  emfLogger: MetricsLogger;
  caller: string;
  courierLogger: CourierLoggerType;

  constructor(caller: string) {
    const envFnName = process.env.AWS_LAMBDA_FUNCTION_NAME.split("-").pop();
    this.caller = caller;
    const tracingInfo = process.env._X_AMZN_TRACE_ID;
    const TRACE_ID_REGEX = /^Root=(.+);Parent=(.+);/;
    const matches = tracingInfo.match(TRACE_ID_REGEX) || ["", "", ""];

    const xrayMeta = {
      "X-Amzn-Trace-Id": tracingInfo,
      "X-Amzn-Trace-Id-Root": matches[1],
      "X-Amzn-Trace-Id-Parent": matches[2],
    };

    const { logger } = new CourierLogger(this.caller, () => ({
      timestamp: new Date().toISOString(),
    }));

    this.courierLogger = logger.child({
      options: {
        debug: !!process.env.ENABLE_DEBUG,
      },
    });

    this.emfLogger = createMetricsLogger();
    this.emfLogger.setNamespace(envFnName);
    this.emfLogger.setProperty("X-Ray", xrayMeta);
    this.emfLogger.setProperty(
      "LambdaFunctionVersion",
      process.env.AWS_LAMBDA_FUNCTION_VERSION
    );
  }

  /**
   * This should be a low cardinality value. Every new dimension costs money.
   * @param dimensionArray
   */
  addDimensions(dimensionArray: Array<Record<string, string>>) {
    this.emfLogger.setDimensions(...dimensionArray);
  }

  addMetrics(
    metricArray: Array<{ metricName: string; value: number; unit: Unit }>
  ) {
    metricArray.forEach(({ metricName, value, unit }) => {
      this.emfLogger.putMetric(metricName, value, unit);
    });
  }

  addProperties(propertyArray: Array<Record<string, any>>) {
    propertyArray.forEach((propertyObj) => {
      Object.keys(propertyObj).forEach((key) => {
        this.emfLogger.setProperty(key, propertyObj[key]);
      });
    });
  }

  async end() {
    this.courierLogger.debug("Writing metrics");
    await this.emfLogger.flush();
  }
}
