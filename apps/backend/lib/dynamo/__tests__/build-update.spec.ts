import { buildDynamoUpdate } from "../build-update";

describe("buildDynamoUpdate", () => {
  it("should build a proper update object", () => {
    const update = buildDynamoUpdate({
      foo: "bar",
      baz: "qux",
    });

    expect(update.UpdateExpression).toEqual("SET #foo = :foo, #baz = :baz");
    expect(update.ExpressionAttributeNames).toEqual({
      "#foo": "foo",
      "#baz": "baz",
    });
    expect(update.ExpressionAttributeValues).toEqual({
      ":foo": "bar",
      ":baz": "qux",
    });
  });

  it("should handle an empty object", () => {
    const update = buildDynamoUpdate({});

    expect(update.UpdateExpression).toEqual("");
    expect(update.ExpressionAttributeNames).toEqual({});
    expect(update.ExpressionAttributeValues).toEqual({});
  });
});
