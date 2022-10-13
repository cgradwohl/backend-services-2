const generateSlackWebhookBody = (payload: any) =>
  `payload=${encodeURIComponent(JSON.stringify(payload))}`;

export default generateSlackWebhookBody;
