import Analytics from "analytics-node";
import { promisify } from "util";

import getTenantInfo from "~/lib/get-tenant-info";
import { error } from "~/lib/log";

import { Group } from "./types";

let asyncGroup;
let client: Analytics;
const segmentWriteKey = process.env.SEGMENT_WRITE_KEY;

try {
  client = new Analytics(segmentWriteKey);
  asyncGroup = promisify(client.group.bind(client));
} catch (e) {
  error(e && e.message ? e.message : e);
}

export const group = async (data: Group) => {
  // all usage data should be reported without env-scoping
  const { tenantId } = getTenantInfo(data.groupId as string);
  data.groupId = tenantId;

  if (asyncGroup) {
    await asyncGroup(data);
  }
};
