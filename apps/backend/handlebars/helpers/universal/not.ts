/**
 * usage: {{#if (and (not false) true)}}
 *
 * should:
 *   - return a boolean inverse of the value
 */
function notHandlebarsHelper(value: any) {
  return !value;
}

export default notHandlebarsHelper;
