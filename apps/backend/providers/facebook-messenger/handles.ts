import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) => !!(profile as any).facebookPSID;

export default handles;
