import { AudienceService } from "~/audiences/services";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { actionService } from "~/send/service";
import { ISendAudiencesMemberAction, ISendAudiencesAction } from "~/send/types";
import { sendAudiences } from "~/send/worker/commands/audiences/send-audiences";

async function handler(payload: ISendAudiencesAction) {
  const { tenantId, requestId, audienceId, dryRunKey } = payload;
  const audienceService = new AudienceService(tenantId);

  const audience = await audienceService.getAudience(audienceId);

  if (!audience) {
    // TODO this should produce a equivalent event log entry that would inform the user that the audience was not found
    console.warn(
      `Audience ${JSON.stringify(audienceId)} not found for tenant ${tenantId}`
    );
    return;
  }

  const { items: audienceMembers, paging } =
    await audienceService.listAudienceMembers(
      audienceId,
      audience.version,
      payload.cursor
    );

  const memberCount = audience.memberCount ?? audienceMembers.length ?? 0;

  if (memberCount > 0) {
    await Promise.all(
      audienceMembers.map(({ userId: memberId }) =>
        actionService(tenantId).emit<ISendAudiencesMemberAction>({
          command: "send-audiences-member",
          dryRunKey,
          memberId,
          requestId,
          tenantId,
        })
      )
    );
  }
  // more members in the audiences
  if (paging.cursor) {
    await sendAudiences({
      ...payload,
      cursor: paging.cursor,
    });
  }
}

export default createEventHandlerWithFailures<ISendAudiencesAction>(
  handler,
  process.env.AUDIENCES_TRIGGER_STREAM_SEQUENCE_TABLE
);
