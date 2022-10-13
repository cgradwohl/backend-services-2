/**
 * usage: {{#truncate "super duper long text" length suffix }}
 *
 * should:
 *   - should truncate a string to the length specified and optionally suffix
 *     a value (eg: an ellipsis)
 */
function truncateHandlebarsHelper(str: string, limit: number, suffix?: string) {
  if (!str || typeof str !== "string") {
    return str;
  }

  const postfix = suffix && typeof suffix === "string" ? suffix : "";
  return `${str.substring(0, limit)}${postfix}`;
}

export default truncateHandlebarsHelper;
