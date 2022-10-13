import { syncUser } from "~/lib/workos/directory-sync";
import { UserData } from "../webhook-types";

export async function handleDSyncUserDeleted(
  userData: UserData,
  timestamp: number
) {
  await syncUser(userData, timestamp);
}
