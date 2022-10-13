import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) => !!(profile as any).pusher?.channel;

export default handles;
