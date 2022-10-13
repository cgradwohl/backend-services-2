import enableDomPurify from "~/lib/enable-dom-purify";

/**
 * Fixes an issue with rendered markdown when a template contained a bolded string like "Hello {name}!".
 * Without this it renders poorly as **Hello** **{name}****!**. This function fixes the issue by
 * *safely* removing the **** between {name} and !.
 */
export const fixBoldMarkdownEdgeCase = ({
  md,
  marker,
  tenantId,
}: {
  md: string;

  /**
   * As of writing, the default markdown bold partial incorrectly uses a single *
   * to indicate bold. This helper is used by the markdownRenderer and the slackRenderer.
   * Note that slack actually does use a single *
   */
  marker: "*" | "**";
  tenantId: string; // Keep scope limited for now.
}): string => {
  if (!enableDomPurify(tenantId, "businessMinusOfficeVibe")) {
    return md;
  }

  // Warning uses lookbehind and lookahead which is not supported everywhere (but is on node v10+)
  const matcher =
    marker === "**"
      ? /(?<=\*\*[^\s\*]+( +[^\s\*]+)*)(\*\*\*\*)(?=[^\s\*]+( +[^\s\*]+)*\*\*)/g
      : /(?<=\*[^\s\*]+( +[^\s\*]+)*)(\*\*)(?=[^\s\*]+( +[^\s\*]+)*\*)/g;

  return md.replace(matcher, "");
};
