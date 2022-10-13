export default {
  captureAWS: jest.fn().mockImplementation(<T>(param: T) => param),
};
