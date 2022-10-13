import { markEmail } from "~/lib/dynamo/messages";
import { UpdateMessageStatusFn } from "./types";

export const profileLoaded: UpdateMessageStatusFn = async (event) => {
  const { messageId, tenantId } = event;

  const json =
    typeof event.json === "string" ? JSON.parse(event.json) : event.json;
  const email = json.mergedProfile?.email;

  if (email) {
    await markEmail(tenantId, messageId, email);
  }
};
