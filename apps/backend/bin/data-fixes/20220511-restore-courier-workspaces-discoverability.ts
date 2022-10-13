import { deleteItem } from "~/lib/dynamo";
import { get as getTenant, update as updateTenant } from "~/lib/tenant-service";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  tenantIds: string[];
}

const COURIER_DOMAINS = ["courier.com", "trycourier.com"];
const DOMAINS_TABLE = process.env.DOMAINS_TABLE;

const handler: Handler<IEvent> = async (event, context) => {
  const { tenantIds } = event;

  for (const tenantId of tenantIds) {
    try {
      const tenant = await getTenant(tenantId);

      if (tenant?.domains?.length) {
        // drop ones that are not Courier
        const domains = tenant.domains.filter((domain) =>
          COURIER_DOMAINS.includes(domain)
        );
        if (!domains.length) {
          // this should not happen
          console.error(
            `Dropping tenant ${tenantId} because it did not have any Courier domains`
          );
          return;
        }

        console.log(`Updating tenant ${tenantId} to RESTRICTED`);
        await updateTenant(
          { tenantId },
          { domains: [], discoverable: "RESTRICTED" }
        );

        domains.map(async (domain) => {
          console.log(`Deleting domain ${domain} for ${tenantId}`);
          await deleteItem({
            Key: {
              pk: `domain/${domain}`,
              sk: tenantId,
            },
            TableName: DOMAINS_TABLE,
          });
        });
      }
    } catch (err) {
      console.error(`Something crapped out for tenant ${tenantId}`);
    }
  }
};

export default handler;
