import abs from "./abs";
import add from "./add";
import ceil from "./ceil";
import divide from "./divide";
import floor from "./floor";
import mod from "./mod";
import multiply from "./multiply";
import round from "./round";
import subtract from "./subtract";

export default {
  abs,
  add,
  ceil,
  divide,
  floor,
  mod,
  multiply,
  product: multiply, // alias for multiply
  round,
  sub: subtract, // alias for subtract
  subtract,
};
