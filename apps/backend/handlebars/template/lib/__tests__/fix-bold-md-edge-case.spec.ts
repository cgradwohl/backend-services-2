import { fixBoldMarkdownEdgeCase } from "../fix-bold-md-edge-case";

describe("fixBoldMarkdownEdgeCase", () => {
  it("Handles ** bolded strings with edge case", () => {
    const broken = "**Ready to start onboarding,** **Drew****?**";
    const expected = "**Ready to start onboarding,** **Drew?**";
    const result = fixBoldMarkdownEdgeCase({
      md: broken,
      marker: "**",
      tenantId: "",
    });
    expect(result).toEqual(expected);
  });

  it("Handles * bolded strings with edge case", () => {
    const broken = "*Ready to start onboarding,* *Drew**?*";
    const expected = "*Ready to start onboarding,* *Drew?*";
    const result = fixBoldMarkdownEdgeCase({
      md: broken,
      marker: "*",
      tenantId: "",
    });
    expect(result).toEqual(expected);
  });

  it("Doesn't remove intentional ****", () => {
    const broken = "Hello **** my ****name is **Drew****?**";
    const expected = "Hello **** my ****name is **Drew?**";
    const result = fixBoldMarkdownEdgeCase({
      md: broken,
      marker: "**",
      tenantId: "",
    });
    expect(result).toEqual(expected);
  });
});
