/**
 * usage: {{capitalize "courier")}} => "Courier"
 * usage: {{capitalize "try courier")}} => "Try courier" (does not support words)
 *
 * should:
 *   - capitalize the first character given a string
 */
function helper(str: string) {
  if (!str || str.trim().length === 0) {
    return str;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default helper;
