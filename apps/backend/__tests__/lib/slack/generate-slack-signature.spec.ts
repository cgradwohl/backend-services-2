import generateSlackSignature from "~/lib/slack/generate-slack-signature";

describe("generateSlackSignature", () => {
  it("should generate a slack signature", () => {
    expect(
      generateSlackSignature(
        "my-signing-secret",
        "556354800000",
        "my-body-value"
      )
    ).toEqual(
      "v0=690803ba4c887abfe13e713b573c176c1cf3af7d710944578547d4cabeff2294"
    );
  });
});
