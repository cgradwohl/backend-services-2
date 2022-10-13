import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) => !!(profile as any).email;

export default handles;
