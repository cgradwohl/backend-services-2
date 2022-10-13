/**
 * usage: {{#if (and true 1 "yay")}} or {{#if (and true false)}}
 *
 * should:
 *   - return true if all arguments are truthy
 *   - return false if one argument is falsy
 *   - return true if no arguments
 */
function andHandlebarsHelper(...args) {
  // remove options
  args.pop();
  return args.every(Boolean);
}

export default andHandlebarsHelper;
