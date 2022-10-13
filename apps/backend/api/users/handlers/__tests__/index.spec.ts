import { getHandler } from "../index";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");

describe("getHandler", () => {
  it("Gets /users/{id}/tokens/{token} resource handlers", () => {
    const genContext = (method: string): any => ({
      event: {
        httpMethod: method,
        resource: "/users/{id}/tokens/{token}",
      },
    });

    const handlerGet = getHandler(genContext("GET"));
    const handlerPut = getHandler(genContext("Put"));
    const handlerPatch = getHandler(genContext("PATCH"));
    const handlerDelete = getHandler(genContext("DELETE"));

    expect(handlerGet).toBeDefined();
    expect(handlerPut).toBeDefined();
    expect(handlerPatch).toBeDefined();
    expect(handlerDelete).toBeDefined();
  });
});
