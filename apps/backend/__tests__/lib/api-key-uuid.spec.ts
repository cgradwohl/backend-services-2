import { isAPIKey, toApiKey } from "~/lib/api-key-uuid";
import uuid from "uuid";

describe("uuid to apikey", () => {
  it("will generate a valid apikey", () => {
    const id = uuid.v4();
    const apiKey = toApiKey(id);

    expect(isAPIKey(apiKey)).toBeTruthy();
  });

  it("will not confused strings with 28 chars that are lowercase", () => {
    const apiKey = "qwertyuiopasdfghjklzxcvbnmqw";

    expect(apiKey.length).toBe(28);
    expect(isAPIKey(apiKey)).toBeFalsy();
  });

  it("will let all caps 28 char length pass", () => {
    const apiKey = "qwertyuiopasdfghjklzxcvbnmqw".toUpperCase();

    expect(apiKey.length).toBe(28);
    expect(isAPIKey(apiKey)).toBeTruthy();
  });

  it("wont pass with dots in the id", () => {
    const apiKey = "qwerty.uiop.asd.ghjklzx.vbnm".toUpperCase();

    expect(apiKey.length).toBe(28);
    expect(isAPIKey(apiKey)).toBeFalsy();
  });

  it("wont pass with dashes in the id", () => {
    const apiKey = "qwerty-uiop-asd-ghjklzx-vbnm".toUpperCase();

    expect(apiKey.length).toBe(28);
    expect(isAPIKey(apiKey)).toBeFalsy();
  });
});
