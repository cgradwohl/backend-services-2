import { v4 as uuid } from "uuid";
import { toApiKey } from "~/lib/api-key-uuid";
import { ILinkData, isLinkOptions } from "~/lib/link-handler";
import { getTrackingDomain } from "../tracking-domains";

interface ILinks {
  [key: string]: ILinkData;
}

export const getLinkTrackingCallback = async (
  links: ILinks,
  fullTenantId: string
) => {
  const trackingDomain = await getTrackingDomain(fullTenantId);
  return (context: string): ILinkData => {
    const link = links[context];
    const [tenantId, env] = fullTenantId.split("/");
    const tenantIdUrlFragment = env ? `${tenantId}-${env}` : tenantId;

    // create a tracking id
    const trackingId = toApiKey(uuid()).toLowerCase();
    link.trackingId = trackingId;

    // is this a link? (has href that we will need to swap out?)
    if (isLinkOptions(link.options)) {
      // create tracking link
      const trackingHref = trackingDomain
        ? `https://${tenantIdUrlFragment}.${trackingDomain}/r/${trackingId}`
        : `${process.env.API_URL}/r/${tenantIdUrlFragment}.${trackingId}`;

      // update link so trackingHref will get used during render
      link.trackingHref = trackingHref;
    }

    return link;
  };
};
