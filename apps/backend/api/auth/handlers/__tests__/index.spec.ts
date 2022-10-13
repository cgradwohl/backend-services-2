import { getHandler } from "../index";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");

describe("getHandler", () => {
  it("Gets /auth/issue-token resource handlers", () => {
    const genContext = (method: string): any => ({
      event: {
        httpMethod: method,
        resource: "/auth/issue-token",
      },
    });

    const handlerPost = getHandler(genContext("POST"));

    expect(handlerPost).toBeDefined();
  });
});
