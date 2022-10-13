export function createAuditEventKey(
  auditEventId: string,
  timestamp: string,
  workspaceId: string
) {
  return {
    pk: `${workspaceId}/${auditEventId}`,
    sk: `${timestamp}`,
  };
}
