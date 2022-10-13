import { generateMd5Prefix } from "~/lib/s3/generate-md5-prefix";
describe("generate md5 prefix", () => {
  it("should return a prefix of length 3", () => {
    const event = {
      id: "fake-event-id",
    };

    expect(generateMd5Prefix(3, event.id)).toHaveLength(3);
  });

  it("should return a prefix of length 5", () => {
    const event = {
      id: "fake-event-id",
    };

    expect(generateMd5Prefix(5, event.id)).toHaveLength(5);
  });

  it("should return a one to one mapping of id to prefix", () => {
    const id1 = "fake-event-id";
    const id2 = "fake-event-id";

    const prefix1 = generateMd5Prefix(3, id1);
    const prefix2 = generateMd5Prefix(3, id2);
    expect(prefix1).toBe(prefix2);
  });
});
