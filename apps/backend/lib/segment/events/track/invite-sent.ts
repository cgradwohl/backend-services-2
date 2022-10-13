import { defaultHandler } from "./index";

import {
  IAnalyticsEventResponse,
  IInviteSentAnalyticsEvent,
} from "../../types";

// https://segment.com/docs/connections/spec/#invite-sent
export default ({
  body,
  key,
  tenantId,
  userId,
}: IInviteSentAnalyticsEvent): IAnalyticsEventResponse => {
  const base = defaultHandler({ key, tenantId, userId });
  const { inviteeEmail } = body;
  const extended = {
    properties: {
      invitee_email: inviteeEmail,
      invitee_role: "User",
    },
  };
  return { ...base, ...extended };
};
