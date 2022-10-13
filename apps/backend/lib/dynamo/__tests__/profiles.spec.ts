import { getNotificationId } from "../profiles";
import uuidPackage from "uuid-apikey";
import { v4 } from "uuid";
describe("get notification id", () => {
  it("should return the notification id if given a valid API KEY", () => {
    const API_KEY = uuidPackage.toAPIKey(v4());
    const result = getNotificationId(API_KEY);

    expect(result).toBe(API_KEY);
  });
  it("should return an API KEY if given a valid UUID", () => {
    const UUID = v4();
    const result = getNotificationId(UUID);

    expect(result).toBe(uuidPackage.toAPIKey(UUID, { noDashes: true }));
  });
  it("should return undefined if given an invalid API KEY", () => {
    const API_KEY = "invalid";
    const result = getNotificationId(API_KEY);

    expect(result).toBeUndefined();
  });
});
