import { ContextService } from "../../types";

const createMock = jest.fn();
const getMock = jest.fn();

const mockContextService: ContextService = () => {
  return {
    create: createMock,
    get: getMock,
  };
};

export default mockContextService;
