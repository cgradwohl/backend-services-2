import { TenantRouting } from "~/types.internal";
import {
  ArgumentRequiredError,
  InvalidAutomationEntityError,
} from "../../types";
import { AutomationRun } from "../run.entity";

jest.mock("~/lib/get-hash-from-range", () => {
  return { getHashFromRange: () => 4 };
});

describe("class AutomationRun", () => {
  test("constructor - failure", () => {
    const item = {};
    expect(() => new AutomationRun(item as any)).toThrow(ArgumentRequiredError);
  });

  test("constructor - success", () => {
    const item = {
      cancelationToken: "mock",
      context: "mock",
      dryRunKey: "mock" as TenantRouting,
      runId: "mock",
      scope: "draft/production",
      source: ["mock"],
      status: "mock",
      updated: "mock",
      tenantId: "mock",
    };

    const run = new AutomationRun(item);
    expect(run.created).toBeDefined();
    expect(run.updated).toBeDefined();
    expect(run.shard).toBe(4);
    expect(run.___type___).toBe("run");
  });

  test("fromItem - failure", () => {
    const Item = {
      cancelationToken: "mock",
      context: "mock",
      dryRunKey: "mock" as TenantRouting,
      runId: "mock",
      scope: "draft/production",
      source: ["mock"],
      status: "mock",
      updated: "mock",
      tenantId: "mock",
    };
    expect(() => AutomationRun.fromItem(Item)).toThrow(
      InvalidAutomationEntityError
    );
  });

  test("fromItem - success", () => {
    const Item = {
      cancelationToken: "mock",
      created: "mock",
      context: "mock",
      dryRunKey: "mock" as TenantRouting,
      runId: "mock",
      scope: "draft/production",
      shard: 5,
      source: ["mock"],
      status: "mock",
      updated: "mock",
      tenantId: "mock",
    };
    const run = AutomationRun.fromItem(Item);
    expect(run.created).toBeDefined();
    expect(run.updated).toBeDefined();
    expect(run.shard).toBe(5);
    expect(run.___type___).toBe("run");
  });

  test("toItem", () => {
    const run = new AutomationRun({
      cancelationToken: "mock",
      context: "mock",
      dryRunKey: "mock" as TenantRouting,
      runId: "mock",
      scope: "draft/production",
      source: ["mock"],
      status: "mock",
      updated: "mock",
      tenantId: "mock",
    });
    const item = run.toItem();
    expect(item.pk).toBe("mock");
    expect(item.sk).toBe("mock");
    expect(run.shard).toBe(4);
    expect(run.tenantId).toBe("mock");
    expect(run.___type___).toBe("run");
  });

  test("key", () => {
    const { pk, sk } = AutomationRun.key({
      runId: "mock_run",
    });
    expect(pk).toBe("mock_run");
    expect(sk).toBe("mock_run");
  });
});
