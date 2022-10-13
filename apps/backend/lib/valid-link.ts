import url from "url";

const validLink = (href: string): boolean => {
  const has = url.parse(href);
  return Boolean(has.protocol && has.host);
};

export default validLink;
