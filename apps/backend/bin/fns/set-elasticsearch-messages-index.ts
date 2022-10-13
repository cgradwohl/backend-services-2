import { setIndex as setMessagesIndex } from "../../lib/elastic-search/messages";

export const handle = async (event: any = {}) => {
  const res = await setMessagesIndex();

  console.log(res);

  return res;
};
