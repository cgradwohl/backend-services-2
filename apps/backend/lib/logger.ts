import pino, { Logger, LoggerOptions } from "pino";

const hooks = {
  logMethod(inputArgs, method, level) {
    if (inputArgs.length >= 2) {
      const arg1 = inputArgs.shift();
      const arg2 = inputArgs.shift();

      if (typeof arg1 === "object") {
        return method.apply(this, [arg1, arg2, ...inputArgs]);
      }

      if (typeof arg2 === "object") {
        return method.apply(this, [arg2, arg1, ...inputArgs]);
      }
    }
    return method.apply(this, inputArgs);
  },
};

export type CourierLoggerType = Logger;
export class CourierLogger {
  defaultLogLevel = process.env.STAGE === "production" ? "warn" : "debug";
  level = process.env.LOG_LEVEL ?? this.defaultLogLevel;

  logger: CourierLoggerType;

  constructor(name: LoggerOptions["name"], mixin?: LoggerOptions["mixin"]) {
    let pinoOptions: LoggerOptions = {
      base: undefined,
      customLevels: {
        fatal: 5,
        error: 4,
        warn: 3,
        info: 2,
        debug: 1,
      },
      enabled: !process.env.DISABLE_LOG,
      formatters: {
        level: (level) => ({ level }),
      },
      level: this.level,
      name,
      nestedKey: "payload",
      messageKey: "msg",
      timestamp: false,
      hooks,
      useOnlyCustomLevels: true,
    };

    if (mixin) {
      pinoOptions = { ...pinoOptions, mixin };
    }

    this.logger = pino(pinoOptions);
  }
}

// TODO: We should remove.
// NOTE: This is added so existing usage of logger is not broken.
export default new CourierLogger("default").logger;
