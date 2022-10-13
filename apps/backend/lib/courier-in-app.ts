import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";
import { subscribe } from "~/lib/lists";

const { COURIER_TENANT_ID } = process.env;

export const subscribeInApp = async (userId, tenantId) => {
  const profile = await getProfile(COURIER_TENANT_ID, userId);
  let profileJSON;
  try {
    profileJSON = JSON.parse(profile?.json);
  } catch {
    profileJSON = {};
  }

  if (!profileJSON?.courier?.channel) {
    await updateProfile(COURIER_TENANT_ID, userId, {
      json: {
        ...profileJSON,
        courier: {
          channel: userId,
        },
        pusher: undefined,
      },
    });
  }

  await subscribe(
    process.env.COURIER_TENANT_ID,
    userId,
    `tenant.${tenantId}`,
    userId
  );
};
