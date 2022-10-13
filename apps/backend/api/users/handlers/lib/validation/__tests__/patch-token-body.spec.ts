import { BadRequest } from "~/lib/http-errors";
import { validatePatchTokenBody } from "../patch-token-body";

describe("validate patch token body", () => {
  it("should not throw given valid patch", () => {
    expect(() =>
      validatePatchTokenBody({
        patch: [
          { op: "replace", path: "/token", value: "token" },
          { op: "add", path: "/properties", value: { test: true } },
        ],
      })
    ).not.toThrow();
  });

  it("should throw given invalid patch", () => {
    expect(() =>
      validatePatchTokenBody({
        patch: [{ op: "bleh", path: "/token", value: "token" }],
      })
    ).toThrow(BadRequest);
    expect(() =>
      validatePatchTokenBody({ op: "bleh", path: "/token", value: "token" })
    ).toThrow(BadRequest);
  });
});
