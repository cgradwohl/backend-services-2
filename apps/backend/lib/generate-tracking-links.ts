export const generateUnsubscribeLink = (
  tenantId: string,
  classification: "n",
  classificationId: string,
  recipientId: string,
  trackingDomain?: string
) => {
  tenantId = tenantId.replace("/test", "-test");
  return trackingDomain
    ? `https://${tenantId}.${trackingDomain}/unsubscribe/${classification}/${classificationId}/${recipientId}`
    : `${process.env.API_URL}/unsubscribe/${classification}/${tenantId}.${classificationId}/${recipientId}`;
};

export const generateUnsubscribeTrackingIdLink = (
  tenantId: string,
  trackingId: string,
  trackingDomain?: string
) => {
  tenantId = tenantId.replace("/test", "-test");
  return trackingDomain
    ? `https://${tenantId}.${trackingDomain}/u/${trackingId}`
    : `${process.env.API_URL}/u/${tenantId}.${trackingId}`;
};

export const generateOpenedLink = (
  tenantId: string,
  trackingId: string,
  trackingDomain?: string
) => {
  tenantId = tenantId.replace("/test", "-test");
  return trackingDomain
    ? `https://${tenantId}.${trackingDomain}/o/${trackingId}.gif`
    : `${process.env.API_URL}/o/${tenantId}.${trackingId}.gif`;
};

export const generateEventTrackingLink = (
  tenantId: string,
  trackingId: string,
  trackingDomain?: string
) => {
  tenantId = tenantId.replace("/test", "-test");
  return trackingDomain
    ? `https://${tenantId}.${trackingDomain}/t/${trackingId}`
    : `${process.env.API_URL}/t/${tenantId}.${trackingId}`;
};

export const generateHostedPreferencesLink = (
  workspaceId: string,
  brandId: string,
  userId: string
): string =>
  `${process.env.API_URL}/p/${Buffer.from(
    `${workspaceId}/${brandId}/${userId}`
  ).toString("base64")}`;
