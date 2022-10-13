import { setIndex as setAutomationRunsIndex } from "../../lib/elastic-search/automation-runs";

export const handle = async (event: any = {}) => {
  const res = await setAutomationRunsIndex();

  console.log(res);

  return res;
};
