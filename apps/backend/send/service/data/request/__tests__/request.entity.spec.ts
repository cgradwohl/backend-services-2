import { Request } from "../request.entity";

jest.mock("~/lib/get-hash-from-range", () => {
  return { getHashFromRange: () => 7 };
});

describe("class Request", () => {
  const request = new Request({
    apiVersion: "2021-11-01",
    dryRunKey: undefined,
    filePath: "abcd",
    idempotencyKey: undefined,
    jobId: undefined,
    requestId: "abcd",
    scope: "published/production",
    source: "efgh",
    sequenceId: undefined,
    triggerId: undefined,
    translated: undefined,
    workspaceId: "wxyz",
  });
  test("constructor should throw", () => {
    const item = {};
    expect(() => new Request(item as any)).toThrow();
  });
  test("constructor", () => {
    expect(request.created).toBeDefined();
    expect(request.shard).toBe(7);
    expect(request.updated).toBeDefined();
    expect(request.translated).toBe(false);
  });
  test("key", () => {
    const itemKey = Request.key({
      requestId: request.requestId,
      workspaceId: request.workspaceId,
    });
    expect(itemKey.pk).toBe("request/abcd");
    expect(itemKey.sk).toBe("request/abcd");
    expect(itemKey.gsi3pk).toBe("workspace/wxyz/7");
    expect(itemKey.gsi3sk).toBe("workspace/wxyz/7/request/abcd");
  });
  test("toItem", () => {
    const item = request.toItem();
    expect(item.pk).toBe("request/abcd");
    expect(item.sk).toBe("request/abcd");
    expect(item.gsi3pk).toBe("workspace/wxyz/7");
    expect(item.gsi3sk).toBe("workspace/wxyz/7/request/abcd");
  });

  test("fromItem", () => {
    const now = new Date().toDateString();
    const Item = {
      apiVersion: "mock",
      created: now,
      dryRunKey: "mock",
      filePath: "mock",
      idempotencyKey: "mock",
      jobId: "mock",
      requestId: "mock",
      scope: "mock",
      source: "mock",
      sequenceId: "mock",
      shard: "mock_shard",
      triggerId: "mock",
      updated: now,
      workspaceId: "mock",
    };

    const request = Request.fromItem(Item);
    expect(request.created).toBe(now);
    expect(request.shard).toBe("mock_shard");
    expect(request.updated).toBe(now);
    expect(request.translated).toBe(false);
  });
});
