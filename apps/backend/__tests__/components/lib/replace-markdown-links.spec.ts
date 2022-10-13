import { replaceMarkdownLinks } from "~/components/lib/replace-markdown-links";
// <tenantId>.<trackingDomain>/r/<slug>
const mockReplaceFn = () =>
  `https://ce79b74a-caad-451c-9bd3-0fd95a2d4ea8.ct0.app/r/51zabp961xmws7gqn72b4t09vw5j`;

describe("replace links in markdown with courier tracking links", () => {
  test("should not anything from a regular markdown", () => {
    const markdown = `# Heading level 1`;
    const markdownWithTrackingLink = replaceMarkdownLinks(
      markdown,
      mockReplaceFn
    );

    expect(markdownWithTrackingLink).toMatch("# Heading level 1");
  });
  test("should replace links with tracking links", () => {
    const markdown = `New to Markdown? Get started[here](https://www.markdownguide.org/basic-syntax/)`;
    const markdownWithTrackingLink = replaceMarkdownLinks(
      markdown,
      mockReplaceFn
    );

    expect(markdownWithTrackingLink).toMatch(
      "New to Markdown? Get started[here](https://ce79b74a-caad-451c-9bd3-0fd95a2d4ea8.ct0.app/r/51zabp961xmws7gqn72b4t09vw5j)"
    );
  });

  test("should not replace relative links with link tracking", () => {
    const markdown = `New to Markdown? Get started[here](/basic-syntax/)`;
    const markdownWithTrackingLink = replaceMarkdownLinks(
      markdown,
      mockReplaceFn
    );

    expect(markdownWithTrackingLink).toMatch(
      "New to Markdown? Get started[here](/basic-syntax/)"
    );
  });
});
