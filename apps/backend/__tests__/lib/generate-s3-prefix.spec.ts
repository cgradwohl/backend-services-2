import generateS3Prefix from "~/lib/generate-s3-prefix";

jest.spyOn(Date.prototype, "getMilliseconds").mockReturnValue(555);
jest.mock("nanoid", () => ({
  nanoid: () => "1234",
}));

describe("generate s3 prefix", () => {
  it("will return correct prefix", () =>
    expect(generateS3Prefix()).toBe("555/1234"));
});
