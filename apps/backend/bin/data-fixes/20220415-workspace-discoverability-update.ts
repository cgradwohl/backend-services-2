import { IDataFixEvent, Handler } from "./types";
import { get as getTenant, update as updateTenant } from "~/lib/tenant-service";

interface IEvent extends IDataFixEvent {
  tenantId: string;
}

const handler: Handler<IEvent> = async (event, context) => {
  const { tenantId } = event;
  const tenant = await getTenant(tenantId);

  console.log(`Updating discoverability for ${tenantId}`);
  console.log(">>>>>>>>TENANT<<<<<<<<<", tenant);

  if (
    tenant.domains?.length &&
    tenant.discoverable === "RESTRICTED" &&
    !tenant.requireSso?.includes("custom")
  ) {
    await updateTenant({ tenantId }, { discoverable: "NEEDS_ACCESS_REQUEST" });
    console.log(
      `Changed discoverability to NEEDS_ACCESS_REQUEST for ${tenantId} `
    );
    return;
  }

  if (tenant.requireSso?.includes("custom")) {
    await updateTenant({ tenantId }, { discoverable: "NEEDS_CONTACT_IT" });
    console.log(`Changed discoverability to NEEDS_CONTACT_IT for ${tenantId} `);
    return;
  }
};

export default handler;
