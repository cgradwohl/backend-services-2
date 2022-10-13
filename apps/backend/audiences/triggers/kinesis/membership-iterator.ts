import { nanoid } from "nanoid";
import { evaluateAudienceMembership } from "~/audiences/lib/audience-rule-engine";
import { updateAudienceCalculation } from "~/audiences/lib/update-audience-calculation";
import { AudienceService } from "~/audiences/services";
import {
  IMembershipIteratorData,
  IMembershipIteratorRecord,
} from "~/audiences/triggers/kinesis/membership-renewal-trigger";
import { query } from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import getEnvironmentVariable from "~/lib/get-environment-variable";
import { putRecord } from "~/lib/kinesis";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import logger from "~/lib/logger";

const StreamName = getEnvironmentVariable("MEMBERSHIP_ITERATOR_STREAM");

// this can be increased based on rate-quee or if customer is on a paid plan
const iteratorLimit = 100;

async function handler(data: IMembershipIteratorData) {
  const { audience, eventName, lastEvaluatedKey } = data;
  const workspaceId = audience.workspaceId;
  const audienceService = new AudienceService(workspaceId);

  const audienceFromDdb = await audienceService.getAudience(
    audience.audienceId
  );
  // this is the only place where we need to check if the audience is still valid
  // if audiences is deleted or updated, we should not continue
  // TODO: Generate appropriate event log for this
  if (!audienceFromDdb) {
    logger.debug(`Audience ${audience.audienceId} is not valid anymore`);
    return;
  }

  if (audienceFromDdb.version !== audience.version) {
    logger.debug(`Bailing out, version mismatch`);
    return;
  }

  if (!audienceFromDdb.filter) {
    logger.debug(`Bailing out, no filter`);
    return;
  }
  const {
    Items: profilesInWorkspace,
    LastEvaluatedKey,
    Count: totalUsers,
  } = await query({
    ExpressionAttributeNames: {
      "#tenantId": "tenantId",
    },
    ExpressionAttributeValues: {
      ":tenantId": workspaceId,
    },
    Limit: iteratorLimit,
    KeyConditionExpression: `#tenantId = :tenantId`,
    ExclusiveStartKey: lastEvaluatedKey,
    TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
  });

  let totalUsersFiltered = 0;

  // Update audiences memberships based on the filter and the profile information
  await Promise.all(
    profilesInWorkspace.map(async (profileJson) => {
      const profile =
        "json" in profileJson && typeof profileJson?.json === "string"
          ? JSON.parse(profileJson.json)
          : profileJson.json;
      const [evaluationResult, reason] = evaluateAudienceMembership(
        audience.filter,
        profile
      );

      if (evaluationResult) {
        await audienceService.putAudienceMember(
          audience.audienceId,
          profileJson.id,
          reason.join(", "),
          audience.version
        );
      } else {
        totalUsersFiltered += 1;
      }
    })
  );
  // If there are more profiles to process, send another membership iterator event, with next page token
  if (LastEvaluatedKey) {
    await putRecord<IMembershipIteratorRecord>({
      Data: {
        audience: {
          audienceId: audience.audienceId,
          version: audience?.version,
          workspaceId: audience.workspaceId,
          filter: audience.filter,
        },
        eventName,
        lastEvaluatedKey: LastEvaluatedKey,
      },
      PartitionKey: nanoid(),
      StreamName,
    });
  }
  // If there are no more profiles to process, mark audience as calculated
  await updateAudienceCalculation(
    audienceFromDdb,
    totalUsers,
    totalUsersFiltered,
    Boolean(LastEvaluatedKey) ? "calculating" : "calculated"
  );
}

export default createEventHandlerWithFailures<IMembershipIteratorData>(
  handler,
  process.env.MEMBERSHIP_ITERATOR_STREAM_SEQUENCE_TABLE
);
