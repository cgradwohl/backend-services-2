import { nanoid } from "nanoid";
import { Message } from "../message.entity";

jest.mock("nanoid", () => {
  return { nanoid: () => "1234" };
});

describe("class Message", () => {
  const message = new Message({
    filePath: "abcd",
    messageId: nanoid(),
    jobId: undefined,
    requestId: "abcd",
    sequenceId: undefined,
    sequenceActionId: undefined,
    triggerId: undefined,
    triggerEventId: undefined,
    workspaceId: "wxyz",
  });
  test("constructor should throw", () => {
    const item = {};
    expect(() => new Message(item as any)).toThrow();
  });
  test("constructor", () => {
    expect(message.created).toBeDefined();
    expect(message.updated).toBeDefined();
  });
  test("key", () => {
    const itemKey = message.key();
    expect(itemKey.pk).toBe("request/abcd");
    expect(itemKey.sk).toBe("message/1234");
    expect(itemKey.gsi1pk).toBe("message/1234");
    expect(itemKey.gsi1sk).toBe("message/1234");
  });
  test("toItem", () => {
    const item = message.toItem();
    expect(item.pk).toBe("request/abcd");
    expect(item.sk).toBe("message/1234");
    expect(item.gsi1pk).toBe("message/1234");
    expect(item.gsi1sk).toBe("message/1234");
  });
});
