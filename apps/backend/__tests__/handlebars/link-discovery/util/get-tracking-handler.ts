import { ILinkData } from "~/lib/link-handler";

const getTrackingHandler = (links: { [context: string]: ILinkData }) => (
  context: string
) => {
  const linkData = links[context];
  // cheap hash
  const trackingId = Buffer.from(linkData.context)
    .reverse()
    .toString("base64")
    .toLowerCase();
  linkData.trackingId = trackingId;
  linkData.trackingHref = `https://abc-tenant-id.ct0.app/r/${trackingId}`;
};

export default getTrackingHandler;
