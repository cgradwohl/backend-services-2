import { MessageJob } from "../message-job.entity";

jest.mock("nanoid", () => {
  return { nanoid: () => "1234" };
});

describe("class MessageJob", () => {
  const job = new MessageJob({
    messageId: "qrst",
    filePath: "abcd",
    requestId: "abcd",
    sequenceId: undefined,
    sequenceActionId: undefined,
    triggerId: undefined,
    triggerEventId: undefined,
    workspaceId: "wxyz",
  });
  test("constructor should throw", () => {
    const item = {};
    expect(() => new MessageJob(item as any)).toThrow();
  });
  test("constructor", () => {
    expect(job.created).toBeDefined();
    expect(job.updated).toBeDefined();
  });
  test("key", () => {
    const itemKey = job.key();
    expect(itemKey.pk).toBe("request/abcd");
    expect(itemKey.sk).toBe("messageJob/1234");
    expect(itemKey.gsi1pk).toBe("message/qrst");
    expect(itemKey.gsi1sk).toBe("messageJob/1234");
    expect(itemKey.gsi2pk).toBe("messageJob/1234");
    expect(itemKey.gsi2sk).toBe("messageJob/1234");
  });
  test("toItem", () => {
    const item = job.toItem();
    expect(item.pk).toBe("request/abcd");
    expect(item.sk).toBe("messageJob/1234");
    expect(item.gsi1pk).toBe("message/qrst");
    expect(item.gsi1sk).toBe("messageJob/1234");
    expect(item.gsi2pk).toBe("messageJob/1234");
    expect(item.gsi2sk).toBe("messageJob/1234");
  });
});
