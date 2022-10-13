import { removeUndefinedFields } from "../remove-undefined-fields";

describe("remove undefined fields", () => {
  it("removes undefined fields of an object", () => {
    expect(
      removeUndefinedFields({
        foo: "bar",
        baz: undefined,
        qux: {
          foo: "bar",
          baz: undefined,
        },
      })
    ).toStrictEqual({
      foo: "bar",
      qux: {
        foo: "bar",
      },
    });
  });
});
