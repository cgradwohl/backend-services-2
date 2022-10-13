import { syncUser } from "../directory-sync";
import { UserData } from "../webhook-types";

export async function handleDSyncUserCreated(
  userData: UserData,
  timestamp: number
) {
  return syncUser(userData, timestamp);
}
