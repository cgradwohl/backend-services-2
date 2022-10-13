import { syncUser } from "../directory-sync";
import { UserData } from "../webhook-types";

export async function handleDSyncUserUpdated(
  userData: UserData,
  timestamp: number
) {
  await syncUser(userData, timestamp);
}
