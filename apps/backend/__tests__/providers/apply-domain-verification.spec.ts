import { EmailDomainBlockedError } from "~/lib/assertions/email-domain-allowed";
import providers from "~/providers";
import sendHandlers from "~/providers/send-handlers";

const emailProviders = [];

for (const key in providers) {
  if (providers[key].taxonomy?.channel === "email") {
    emailProviders.push(key);
  }
}

const linkHandler = {
  addLink: expect.any(Function),
  addWebhook: expect.any(Function),
  getHref: expect.any(Function),
  getPrefixedHandler: expect.any(Function),
  getScopedHandler: expect.any(Function),
  getTrackingId: expect.any(Function),
  handleHref: expect.any(Function),
  handleWebhook: expect.any(Function),
  supportsWebhook: expect.any(Function),
  trackingEnabled: expect.any(Function),
};

const variableHandler = {
  getContext: expect.any(Function),
  getParent: expect.any(Function),
  getRoot: expect.any(Function),
  getRootValue: expect.any(Function),
  getScoped: expect.any(Function),
  repeat: expect.any(Function),
  replace: expect.any(Function),
  resolve: expect.any(Function),
  resolveV2: expect.any(Function),
};

describe("applyDomainChecking", () => {
  const email = "email@example.com";
  const profile = { email };

  for (const key of emailProviders) {
    it(`should wrap ${key} provider with a domain checking fn`, async () => {
      await expect(async () => {
        const sendHandler = sendHandlers[key];
        const recipient = "RECIPIENT_12345";

        await sendHandler(
          {
            config: { provider: key },
            linkHandler,
            profile,
            variableData: {
              data: {},
              event: "EVENT_ID",
              profile,
              recipient,
            },
            variableHandler,
          },
          {}
        );
      }).rejects.toThrowError(EmailDomainBlockedError);
    });
  }
});
