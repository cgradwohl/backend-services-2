import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) =>
  !!profile?.email || !!(profile?.magicbell as any)?.external_id;

export default handles;
