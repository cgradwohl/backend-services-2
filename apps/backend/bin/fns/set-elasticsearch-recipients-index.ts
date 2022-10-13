import { setIndex as setRecipients_2022_01_28_Index } from "../../lib/elastic-search/recipients/recipients";

export const handle = async () => {
  const res = await setRecipients_2022_01_28_Index();
  console.log(res);
  return res;
};
