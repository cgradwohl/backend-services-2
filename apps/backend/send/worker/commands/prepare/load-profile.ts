import { UserRecipient } from "~/api/send/types";
import { createProfileLoadedEvent } from "~/lib/dynamo/event-logs";
import { fetchAndMergeProfile, IProfileObject } from "~/lib/dynamo/profiles";
import { IProfile } from "~/types.api";

const loadProfile = async ({
  tenantId,
  to,
  messageId,
  shouldVerifyRequestTranslation = false,
}: {
  tenantId: string;
  messageId: string;
  to: UserRecipient;
  shouldVerifyRequestTranslation?: boolean;
}): Promise<{ profile: IProfile; savedProfile: IProfileObject }> => {
  const { mergedProfile, savedProfile } = await fetchAndMergeProfile({
    tenantId,
    toProfile: to,
  });

  if (shouldVerifyRequestTranslation === false) {
    await createProfileLoadedEvent(tenantId, messageId, {
      mergedProfile,
      savedProfile,
      sentProfile: to,
    });
  }

  return { profile: mergedProfile, savedProfile };
};

export default loadProfile;
