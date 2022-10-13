import { IDataFixEvent, Handler } from "./types";
import { verifyEmail } from "~/lib/kickbox";
import { get as getTenant, update as updateTenant } from "~/lib/tenant-service";
import { getUser } from "~/lib/cognito";
import { addTenantToDomain } from "~/lib/domains";
import * as CompanyEmailValidator from "company-email-validator";

interface IEvent extends IDataFixEvent {
  tenantId: string;
}

const handler: Handler<IEvent> = async (event, context) => {
  const { tenantId } = event;
  const tenant = await getTenant(tenantId);

  //ignore archived tenants or tenants that already have a domain
  if (tenant && !tenant.domains?.length) {
    console.log(`Updating domains and discoverability for ${tenantId}`);
    console.log(">>>>>>>>TENANT<<<<<<<<<", tenant);

    let owner;

    try {
      owner = await getUser(tenant.owner);
    } catch (e) {
      console.log(
        `owner ${
          tenant.owner
        } of tenant ${tenantId} could not be verified because ${e.toString()}`
      );
    }

    if (owner?.email.toLowerCase().includes("e.rainforestqa")) {
      return;
    }

    const isCompanyEmail = CompanyEmailValidator.isCompanyEmail(owner.email);

    if (isCompanyEmail) {
      try {
        const ownerKickboxData = await verifyEmail(owner.email);

        if (ownerKickboxData?.isCompanyEmail && ownerKickboxData?.domain) {
          console.log(
            `Adding domain ${ownerKickboxData.domain} to ${tenantId}`
          );

          await updateTenant(
            { tenantId },
            { domains: [ownerKickboxData.domain] }
          );

          await addTenantToDomain(ownerKickboxData.domain, tenantId);

          if (tenant.discoverable !== "NEEDS_CONTACT_IT") {
            console.log(
              `Changing discoverability of ${tenantId} from ${tenant.discoverable} to "NEEDS_ACCESS_REQUEST"`
            );

            await updateTenant(
              { tenantId },
              { discoverable: "NEEDS_ACCESS_REQUEST" }
            );
          } else {
            //tenant.discoverable should always return "NEEDS_CONTACT_IT", we want to have a count of these cases
            console.log(
              `Discoverability of ${tenantId} was not changed as it is ${tenant.discoverable}`
            );
          }
        }
      } catch (error) {
        console.log(
          `Tenant ${tenantId} could not be verified because of ${error.toString()}`
        );
      }
    }
  }
};

export default handler;
