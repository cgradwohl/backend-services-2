import checkSlackSignature from "~/lib/slack/check-slack-signature";

describe("checkSlackSignature", () => {
  it("should generate a slack signature and compare it with the provided signature", () => {
    expect(() =>
      checkSlackSignature(
        "test-signature",
        "my-test-body",
        "v0=91f37fec779c230e78503161873993d74c7cf474a5ee7dc01a9fd20d4ca931bb",
        "1588808901157"
      )
    ).not.toThrow();
  });

  it("should throw if the signature is too short", () => {
    expect(() =>
      checkSlackSignature(
        "test-signature",
        "my-test-body",
        "this-signature-is-too-short",
        "1588808901157"
      )
    ).toThrow(/^Invalid signature/);
  });

  it("should throw if the signatures do not match", () => {
    expect(() =>
      checkSlackSignature(
        "test",
        "my-test-body",
        "v0=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "1588808901157"
      )
    ).toThrow(/^Invalid signature/);
  });
});
