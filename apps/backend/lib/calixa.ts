import axios from "axios";
import formatISO from "date-fns/formatISO";

const CALIXA_ACCOUNT_ID = process.env.CALIXA_ACCOUNT_ID ?? "aki_jkuy77gh8hx";
const CALIXA_ACCOUNT_KEY = process.env.CALIXA_ACCOUNT_KEY;
const CALIXA_USAGE_METRIC = process.env.CALIXA_USAGE_METRIC || "md_87ceaaa8";

export const incrementUsage = async (
  tenantId: string,
  usage: number,
  timestamp: number | Date
) => {
  if (!CALIXA_ACCOUNT_KEY) {
    // tslint:disable-next-line: no-console
    console.warn("CALIXA_ACCOUNT_KEY is required");
    return;
  }

  await axios({
    auth: {
      password: CALIXA_ACCOUNT_KEY,
      username: CALIXA_ACCOUNT_ID,
    },
    baseURL: "https://api.calixa.io/",
    data: {
      entity_id: tenantId,
      entity_type: "account",
      measured_at: formatISO(timestamp),
      value: usage,
    },
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    timeout: 10000, // 10s
    url: `v1/metrics/${CALIXA_USAGE_METRIC}`,
  });
};
