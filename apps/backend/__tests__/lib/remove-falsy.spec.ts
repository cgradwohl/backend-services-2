import removeFalsy from "~/lib/remove-falsy";

describe("remove falsy", () => {
  it("will remove falsy values", () => {
    expect(
      removeFalsy({
        test: {},
        test2: {
          test3: true,
        },
      })
    ).toEqual({
      test2: {
        test3: true,
      },
    });
  });

  it("will remove falsy values2", () => {
    expect(
      removeFalsy({
        notifications: {
          "123": {
            disabled: true,
          },
        },
        categories: {
          "456": {
            disabled: false,
          },
        },
      })
    ).toEqual({
      notifications: {
        "123": {
          disabled: true,
        },
      },
    });
  });

  it("will remove child objects", () => {
    const myObj = {
      notifications: {},
      categories: {
        "ebc3f897-d2ff-4ee2-8e70-4ecdc1aa6352": {
          disabled: false,
        },
      },
    };

    expect(removeFalsy(myObj)).toEqual(undefined);
  });

  it("will skip arrays", () => {
    const myObj = {
      categoryId: "123",
      deleted: false,
      notifications: [
        {
          disabled: false,
        },
      ],
    };

    expect(removeFalsy(myObj)).toEqual({
      categoryId: "123",
      notifications: [],
    });
  });
});
