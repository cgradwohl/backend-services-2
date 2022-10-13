import { Handler } from "aws-lambda";
import courierTenant from "~/lib/access-grants/courier/tenant";
import { error } from "~/lib/log";
import { ACL } from "./constants";
import { ISymEvent } from "./types";

function resolveUser(event: ISymEvent): string {
  const username = event.run.actors.request.username;
  if (!username) {
    throw new Error(`Invalid event payload`);
  }
  const userId = ACL[username].userId;
  if (!userId) {
    throw new Error(`Forbidden user: ${username}`);
  }
  return userId;
}

function resolveTenant(event: ISymEvent): string {
  const tenantId = event.fields["tenant-id"];
  if (!tenantId) {
    throw new Error(`Invalid event payload`);
  }
  return tenantId;
}

async function updateUser(
  eventType: string,
  tenantId: string,
  userId: string
): Promise<string> {
  switch (eventType) {
    case "escalate":
      await courierTenant.grant(tenantId, userId);
      return `Granting user: ${userId} permission to tenant: ${tenantId}`;
    case "deescalate":
      await courierTenant.revoke(tenantId, userId);
      return `Revoking user: ${userId} permission to tenant: ${tenantId}`;
    default:
      throw new Error(`Unsupported event type: ${eventType}`);
  }
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export const handle: Handler = async (event: ISymEvent) => {
  // tslint:disable-next-line: no-console
  console.log("Got Event: " + JSON.stringify(event, null, 2));
  try {
    const eventType = event.event.type;
    const tenantId = resolveTenant(event);
    const userId = resolveUser(event);
    const message = await updateUser(eventType, tenantId, userId);
    return { body: { message }, errors: [] };
  } catch (err) {
    error(err);
    return { body: {}, errors: [getErrorMessage(err)] };
  }
};
