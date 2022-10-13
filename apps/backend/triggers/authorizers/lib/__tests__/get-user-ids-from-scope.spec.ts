import { getUserIdsFromScopes } from "../get-user-ids-from-scope";

describe("getUserIdsFromScopes", () => {
  it("returns all of the userIds", () => {
    expect(getUserIdsFromScopes(["user_id:drew", "user_id:alex"])).toEqual([
      "drew",
      "alex",
    ]);
  });
});
