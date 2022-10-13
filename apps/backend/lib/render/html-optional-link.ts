const renderOptionalLink = (
  { href, text }: { href: string; text?: string },
  content: string = text || ""
) => {
  return href ? `<a href="${href}">${content}</a>` : content;
};

export default renderOptionalLink;
