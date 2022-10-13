require("dotenv").config();

process.env.DISABLE_LOG = process.env.DISABLE_LOG ?? "true";

// process.env always returns a string so we have to do a direct string comparison
if (process.env.DISABLE_LOG === "true") {
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
} else {
  global.console = {
    log: jest.fn(console.log),
    error: jest.fn(console.error),
    warn: jest.fn(console.warn),
    info: jest.fn(console.info),
    debug: jest.fn(console.debug),
  };
}
