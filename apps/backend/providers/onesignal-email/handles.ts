import emailHandles from "../lib/email/handles";
import { HandlesFn } from "../types";

const handles: HandlesFn = (event) => emailHandles(event);

export default handles;
