import { unauthorized } from "../unauthorized";

describe("unauthorized", () => {
  it("throws unauthorized", () => {
    expect(() => unauthorized()).toThrow("Unauthorized");
  });
});
