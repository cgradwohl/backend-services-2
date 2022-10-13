import { RequestService } from "../../types";

const getMock = jest.fn();
const acceptMock = jest.fn();

const mockRequestService: RequestService = () => {
  return {
    create: acceptMock,
    get: getMock,
  };
};

export default mockRequestService;
