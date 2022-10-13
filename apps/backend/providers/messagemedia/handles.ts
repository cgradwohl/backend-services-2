import { HandlesFn } from "~/providers/types";

const handles: HandlesFn = ({ profile }) => !!(profile as any).phone_number;

export default handles;
