import { SequenceAction } from "../sequence-action.entity";

describe("class SequenceAction", () => {
  const sequenceAction = new SequenceAction({
    filePath: "mock_filePath",
    nextSequenceActionId: "mock_nextSequenceActionId",
    prevSequenceActionId: "mock_prevSequenceActionId",
    requestId: "mock_requestId",
    sequenceId: "mock_sequenceId",
    sequenceActionId: "mock_sequenceActionId_1234",
    triggerId: undefined,
    workspaceId: "mock_workspaceId",
  });

  test("constructor should throw", () => {
    const item = {};
    expect(() => new SequenceAction(item as any)).toThrow();
  });
  test("constructor", () => {
    expect(sequenceAction.created).toBeDefined();
    expect(sequenceAction.prevSequenceActionId).toBeDefined();
    expect(sequenceAction.nextSequenceActionId).toBeDefined();
    expect(sequenceAction.sequenceId).toBeDefined();
    expect(sequenceAction.sequenceActionId).toBeDefined();
    expect(sequenceAction.triggerId).toBeUndefined();
    expect(sequenceAction.updated).toBeDefined();
  });
  test("key", () => {
    const itemKey = SequenceAction.key(sequenceAction);
    expect(itemKey.pk).toBe("request/mock_requestId");
    expect(itemKey.sk).toBe("sequenceAction/mock_sequenceActionId_1234");
    expect(itemKey.gsi1pk).toBe("sequence/mock_sequenceId");
    expect(itemKey.gsi1sk).toBe("sequenceAction/mock_sequenceActionId_1234");
    expect(itemKey.gsi2pk).toBe("sequenceAction/mock_sequenceActionId_1234");
    expect(itemKey.gsi2sk).toBe("sequenceAction/mock_sequenceActionId_1234");
  });
  test("toItem", () => {
    const item = sequenceAction.toItem();
    expect(item.pk).toBe("request/mock_requestId");
    expect(item.sk).toBe("sequenceAction/mock_sequenceActionId_1234");
    expect(item.gsi1pk).toBe("sequence/mock_sequenceId");
    expect(item.gsi1sk).toBe("sequenceAction/mock_sequenceActionId_1234");
    expect(item.gsi2pk).toBe("sequenceAction/mock_sequenceActionId_1234");
    expect(item.gsi2sk).toBe("sequenceAction/mock_sequenceActionId_1234");
    expect(item.created).toBeDefined();
    expect(item.sequenceId).toBeDefined();
    expect(item.triggerId).toBeUndefined();
    expect(item.updated).toBeDefined();
  });
  test("fromItem", () => {
    const Item = {
      filePath: "mock_filePath",
      nextSequenceActionId: "mock_nextSequenceActionId",
      prevSequenceActionId: "mock_prevSequenceActionId",
      requestId: "mock_requestId",
      sequenceId: "mock_sequenceId",
      sequenceActionId: "mock_sequenceActionId_1234",
      triggerId: undefined,
      workspaceId: "mock_workspaceId",
    };

    const sequenceFromItem = SequenceAction.fromItem(Item);

    expect((sequenceFromItem as any).pk).toBeUndefined();
    expect((sequenceFromItem as any).sk).toBeUndefined();
    expect((sequenceFromItem as any).gsi1pk).toBeUndefined();
    expect((sequenceFromItem as any).gsi1sk).toBeUndefined();
    expect((sequenceFromItem as any).gsi2pk).toBeUndefined();
    expect((sequenceFromItem as any).gsi2sk).toBeUndefined();
    expect(sequenceFromItem.created).toBeDefined();
    expect(sequenceFromItem.prevSequenceActionId).toBeDefined();
    expect(sequenceFromItem.nextSequenceActionId).toBeDefined();
    expect(sequenceFromItem.sequenceId).toBeDefined();
    expect(sequenceFromItem.sequenceActionId).toBeDefined();
    expect(sequenceFromItem.triggerId).toBeUndefined();
    expect(sequenceFromItem.updated).toBeDefined();
  });
});
