import { TenantScope } from "~/types.internal.d";
import { Env } from "~/lib/configurations-service/types";
import { ApiKeyAuditEvent } from "~/auditing/types";
import { get as getTenant } from "~/lib/tenant-service";
import { listAccessRights } from "~/lib/tenant-access-rights-service";
import { Message } from "@trycourier/courier/lib/send/types";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";

const TARGET_USER_ROLE = "ADMINISTRATOR";

const getMessageContent = (
  event: ApiKeyAuditEvent,
  scope: TenantScope,
  workspaceEnv: "production" | "test",
  workspaceName: string
) => {
  const timestamp = format(parseISO(event.timestamp), "PPPppp");
  const [, eventType] = event.type.split(":");
  const body = `Courier API key of scope **${scope.toUpperCase()}** was **${eventType}** for **${workspaceEnv.toUpperCase()}** environment in workspace **${workspaceName}** by **${
    event.user.email
  }** on **${timestamp}**`;
  const title = `A Courier API key was ${eventType}`;

  return {
    body,
    title,
  };
};

const createMessage = async (event: ApiKeyAuditEvent): Promise<Message> => {
  const administrators = await listAccessRights(event.workspaceId, {
    role: TARGET_USER_ROLE,
  });

  const [scope, environment] = event.scope.split("/");

  const workspaceDetails = await getTenant(event.workspaceId);

  const users = administrators.map((administrator) => ({
    user_id: administrator.userId,
  }));

  return {
    to: users,
    channels: {
      email: {
        providers: ["sendgrid"],
      },
      push: {
        providers: ["courier"],
      },
    },
    routing: {
      method: "all",
      channels: ["push", "email"],
    },
    content: getMessageContent(
      event,
      scope as TenantScope,
      environment as Env,
      workspaceDetails.name
    ),
  };
};

export default createMessage;
