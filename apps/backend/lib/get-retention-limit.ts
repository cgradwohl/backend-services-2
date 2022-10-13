// TODO: remove file when C-1927 ships
import sub from "date-fns/sub";

const THIRTY_DAY_RETENTION_LIST = [
  "4bbb0473-a777-45ff-9129-befff793533b", // glide
  "5d752899-6b1d-49d7-8c49-1919c9ff1097", // seth dev
];

const getRetentionLimit = (tenantId: string) =>
  THIRTY_DAY_RETENTION_LIST.includes(tenantId)
    ? sub(new Date(), { days: 30 }).getTime() // 30 days
    : sub(new Date(), { days: 365 }).getTime(); // 1 Year

export default getRetentionLimit;
