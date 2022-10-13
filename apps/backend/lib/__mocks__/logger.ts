export const CourierLogger = jest.fn().mockImplementation(() => {
  return {
    logger: {
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    },
  };
});

export default new CourierLogger("default-test").logger;
