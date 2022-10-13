import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) =>
  Boolean((profile.intercom as { [key: string]: any })?.to?.id);

export default handles;
