const getMock = jest.fn();
const putMock = jest.fn();

export default function () {
  return {
    get: getMock,
    put: putMock,
  };
}
