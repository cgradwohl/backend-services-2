export const mockLogger = {
  setNamespace: jest.fn(),
  setDimensions: jest.fn(),
  putMetric: jest.fn(),
  putDimensions: jest.fn(),
  setProperty: jest.fn(),
  flush: jest.fn(),
};

export const createMetricsLogger = () => mockLogger;

export const Unit = {
  Milliseconds: "Milliseconds",
  Count: "Count",
};
