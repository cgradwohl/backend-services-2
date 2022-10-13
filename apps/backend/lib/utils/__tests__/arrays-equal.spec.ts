import { arraysEqual } from "../arrays-equal";

describe("arrays equal", () => {
  it("should return true", () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toEqual(true);
  });

  it("should return false", () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 5])).toEqual(false);
  });
});
