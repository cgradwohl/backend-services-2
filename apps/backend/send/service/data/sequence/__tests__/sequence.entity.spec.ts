import { Sequence } from "../sequence.entity";

describe("class Sequence", () => {
  const sequence = new Sequence({
    filePath: "mock_filePath",
    parentSequenceId: undefined,
    requestId: "mock_requestId",
    sequenceId: "mock_sequenceId",
    triggerId: undefined,
    workspaceId: "mock_workspaceId",
  });

  test("constructor should throw", () => {
    const item = {};
    expect(() => new Sequence(item as any)).toThrow();
  });
  test("constructor", () => {
    expect(sequence.created).toBeDefined();
    expect(sequence.parentSequenceId).toBeUndefined();
    expect(sequence.sequenceId).toBeDefined();
    expect(sequence.triggerId).toBeUndefined();
    expect(sequence.updated).toBeDefined();
  });
  test("key", () => {
    const itemKey = Sequence.key(sequence);
    expect(itemKey.pk).toBe("request/mock_requestId");
    expect(itemKey.sk).toBe("sequence/mock_sequenceId");
    expect(itemKey.gsi1pk).toBe("sequence/mock_sequenceId");
    expect(itemKey.gsi1sk).toBe("sequence/mock_sequenceId");
  });
  test("toItem", () => {
    const item = sequence.toItem();
    expect(item.pk).toBe("request/mock_requestId");
    expect(item.sk).toBe("sequence/mock_sequenceId");
    expect(item.gsi1pk).toBe("sequence/mock_sequenceId");
    expect(item.gsi1sk).toBe("sequence/mock_sequenceId");
    expect(item.created).toBeDefined();
    expect(item.parentSequenceId).toBeUndefined();
    expect(item.sequenceId).toBeDefined();
    expect(item.triggerId).toBeUndefined();
    expect(item.updated).toBeDefined();
  });
  test("fromItem", () => {
    const Item = {
      filePath: "mock_filePath",
      parentSequenceId: undefined,
      requestId: "mock_requestId",
      sequenceId: "mock_sequenceId",
      triggerId: undefined,
      workspaceId: "mock_workspaceId",
    };

    const sequenceFromItem = Sequence.fromItem(Item);
    expect((sequenceFromItem as any).pk).toBeUndefined();
    expect((sequenceFromItem as any).sk).toBeUndefined();
    expect((sequenceFromItem as any).gsi1pk).toBeUndefined();
    expect((sequenceFromItem as any).gsi1sk).toBeUndefined();
    expect(sequenceFromItem.created).toBeDefined();
    expect(sequenceFromItem.parentSequenceId).toBeUndefined();
    expect(sequenceFromItem.sequenceId).toBeDefined();
    expect(sequenceFromItem.triggerId).toBeUndefined();
    expect(sequenceFromItem.updated).toBeDefined();
  });
});
