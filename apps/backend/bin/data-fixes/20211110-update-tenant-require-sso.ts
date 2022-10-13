import { updateTenantSsoRequirement } from "~/lib/tenant-service";
import { IUserSsoProvider } from "~/types.api";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  ssoProvider?: IUserSsoProvider;
}

const handler: Handler<IEvent> = async (event) => {
  const { tenantId, ssoProvider } = event;
  await updateTenantSsoRequirement(tenantId, ssoProvider);
};

export default handler;
