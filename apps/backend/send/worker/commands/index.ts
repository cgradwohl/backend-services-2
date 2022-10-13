import { ActionCommands } from "~/send/types";
import { accept } from "./accept";
import { adHocList } from "./ad-hoc-list";
import { list } from "./list";
import { listPattern } from "./list-pattern";
import { prepare } from "./prepare";
import { request } from "./request";
import { route } from "./route";
import { sendAudiencesMember } from "./audiences";
import { sendAudiences } from "./audiences/send-audiences";

export const actionCommands: ActionCommands = {
  "ad-hoc-list": adHocList,
  "send-audiences-member": sendAudiencesMember,
  "send-audiences": sendAudiences,
  "list-pattern": listPattern,
  accept,
  list,
  prepare,
  request,
  route,
};
