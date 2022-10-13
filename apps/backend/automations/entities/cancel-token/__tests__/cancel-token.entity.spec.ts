import {
  ArgumentRequiredError,
  InvalidAutomationEntityError,
} from "../../types";
import { AutomationCancelToken } from "../cancel-token.entity";

jest.mock("~/lib/get-hash-from-range", () => {
  return { getHashFromRange: () => 3 };
});

describe("class AutomationCancelToken", () => {
  test("constructor - failure", () => {
    const item = {};
    expect(() => new AutomationCancelToken(item as any)).toThrow(
      ArgumentRequiredError
    );
  });

  test("constructor - success", () => {
    const item = {
      runId: "mock",
      token: "mock",
      tenantId: "mock",
    };
    const token = new AutomationCancelToken(item);
    expect(token.created).toBeDefined();
    expect(token.updated).toBeDefined();
    expect(token.___type___).toBe("cancel-token");
    expect(token.runId).toBe("mock");
    expect(token.token).toBe("mock");
    expect(token.tenantId).toBe("mock");
  });

  test("fromItem - failure", () => {
    const Item = {
      runId: "mock",
      token: "mock",
      tenantId: "mock",
    };

    expect(() => AutomationCancelToken.fromItem(Item)).toThrow(
      InvalidAutomationEntityError
    );
  });

  test("fromItem - success", () => {
    const Item = {
      created: "mock",
      runId: "mock",
      token: "mock",
      tokenId: "mock",
      tenantId: "mock",
      updated: "mock",
    };

    expect(() => AutomationCancelToken.fromItem(Item)).not.toThrow(
      InvalidAutomationEntityError
    );
    const token = AutomationCancelToken.fromItem(Item);
    expect(token.created).toBeDefined();
    expect(token.updated).toBeDefined();
    expect(token.___type___).toBe("cancel-token");
    expect(token.runId).toBe("mock");
    expect(token.token).toBe("mock");
    expect(token.tenantId).toBe("mock");
  });

  test("toItem", () => {
    const token = new AutomationCancelToken({
      created: "mock",
      runId: "mock",
      token: "mock",
      tenantId: "mock",
      updated: "mock",
    });

    const item = token.toItem();
    expect(item.pk).toBe("mock/mock");
    expect(item.sk).toBe("mock/run/mock");
    expect(item.tenantId).toBe("mock");
    expect(item.___type___).toBe("cancel-token");
  });

  test("key", () => {
    const { pk, sk } = AutomationCancelToken.key({
      runId: "mock_run",
      tenantId: "mock_tenant",
      token: "mock_token",
    });

    expect(pk).toBe("mock_tenant/mock_token");
    expect(sk).toBe("mock_token/run/mock_run");
  });
});
