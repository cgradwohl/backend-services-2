import { get as getAuditEvent } from "~/auditing/stores/elasticsearch/audit-events";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { IAuditEventApiOutput } from "../services/search";
import { GetFn } from "./types";

const get: GetFn = async (context) => {
  const auditEventId = assertPathParam(context, "id");
  const auditEvent = await getAuditEvent(auditEventId);

  if (!auditEvent) {
    throw new NotFound();
  }

  const response: IAuditEventApiOutput = {
    actor: {
      email: auditEvent.actorEmail,
      id: auditEvent.actorId,
    },
    auditEventId: auditEvent.auditEventId,
    source: auditEvent.source,
    target: {
      email: auditEvent.targetEmail,
      id: auditEvent.targetId,
    },
    timestamp: auditEvent.timestamp,
    type: auditEvent.type,
  };

  return { body: response };
};

export default get;
