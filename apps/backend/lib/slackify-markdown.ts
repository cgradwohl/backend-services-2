import slackifyMarkdown from "slackify-markdown";

export default (markdown: string) => {
  markdown = markdown
    .replace(/<br>/g, "\n")
    .replace(/<br\/>/g, "\n")
    .replace(/<br \/>/g, "\n");

  return slackifyMarkdown(markdown);
};
