import { setIndex } from "~/auditing/stores/elasticsearch/audit-events";

export const handle = async () => {
  const res = await setIndex();

  console.log(res);

  return res;
};
