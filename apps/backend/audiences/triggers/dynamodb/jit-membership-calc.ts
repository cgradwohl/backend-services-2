import { DynamoDBRecord } from "aws-lambda";
import DynamoDB from "aws-sdk/clients/dynamodb";
import { evaluateAudienceMembership } from "~/audiences/lib/audience-rule-engine";
import { AudienceService } from "~/audiences/services";
import { createStreamHandlerWithoutSequenceChecking } from "~/lib/dynamo/create-stream-handler";
import { IProfileObject } from "~/lib/dynamo/profiles";

async function handleRecord(record: DynamoDBRecord) {
  let profile: IProfileObject;
  if (record.eventName === "REMOVE") {
    profile = DynamoDB.Converter.unmarshall(
      record.dynamodb.OldImage
    ) as IProfileObject;
  }

  if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
    profile = DynamoDB.Converter.unmarshall(
      record.dynamodb.NewImage
    ) as IProfileObject;
  }

  const audienceService = new AudienceService(profile.tenantId);
  // TODO: If we get into situation where a workspace has more than 100 audiences defined, we can add batching for this this
  const { items: audiences } = await audienceService.listAudiences();
  await Promise.all(
    audiences
      .filter((audience) => Boolean(audience.filter))
      .map(async (audience) => {
        if (["INSERT", "MODIFY"].includes(record.eventName)) {
          const audienceMemberProfile =
            "json" in profile && typeof profile.json === "string"
              ? JSON.parse(profile.json)
              : profile?.json;

          const [evaluationResult, reason] = evaluateAudienceMembership(
            audience.filter,
            audienceMemberProfile
          );

          if (evaluationResult) {
            await audienceService.putAudienceMember(
              audience.audienceId,
              profile.id,
              reason.join(", "),
              audience.version
            );
          }
        }
        if (record.eventName === "REMOVE") {
          await audienceService.deleteAudienceMember(
            audience.audienceId,
            audience.version,
            profile.id
          );
        }
      })
  );
}

export default createStreamHandlerWithoutSequenceChecking(handleRecord);
