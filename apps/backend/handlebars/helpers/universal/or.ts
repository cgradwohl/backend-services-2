/**
 * usage: {{#if (or true false)}}
 *
 * should:
 *   - return true if one argument is truthy
 *   - return false if all argument are falsy
 *   - return false if no arguments
 */
function orHandlebarsHelper(...args) {
  // remove options
  args.pop();
  return args.some(Boolean);
}

export default orHandlebarsHelper;
