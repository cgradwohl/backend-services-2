import axios from "axios";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { DeliveryHandlerParams } from "~/providers/types";
import webhook from "~/providers/webhook";
import sendHandler from "~/providers/webhook/send";

jest.mock("axios");

const basicDeliveryParams = (
  config: any = {},
  body: any = {},
  override: any = {},
  profile: any = {}
): DeliveryHandlerParams => {
  const variableData = {
    data: {},
    event: "",
    profile: { isMergedProfile: true, ...profile },
    recipient: "",
    ...body,
  };

  const variableHandler = createVariableHandler({ value: variableData });
  const linkHandler = createLinkHandler({});

  return {
    config: {
      auth: "none",
      extendedProfile: "false",
      provider: "webhook",
      url: "https://webhook.url",
      ...config,
    },
    emailTemplateConfig: {},
    extendedProfile: { isExtendedProfile: true },
    linkHandler,
    override,
    profile: variableData.profile,
    sentProfile: { isSentProfile: true },
    variableData,
    variableHandler,
  };
};

describe("webhook provider", () => {
  describe("send", () => {
    afterEach(() => {
      (axios as any).mockClear();
    });

    it("should call a given webhook url", async () => {
      (axios as any).mockResolvedValueOnce({
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      });

      const params = basicDeliveryParams();

      const templates = {
        payload: {
          data: {},
          event: "",
          profile: { isSentProfile: true },
          recipient: "",
        },
      };

      await expect(sendHandler(params, templates)).resolves.toEqual({
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      });

      expect((axios as any).mock.calls[0]).toEqual([
        {
          data: {
            data: {},
            event: "",
            profile: { isSentProfile: true },
            recipient: "",
          },
          headers: {},
          method: "post",
          timeout: 10000,
          timeoutErrorMessage: "Webhook API request timed out.",
          url: "https://webhook.url",
        },
      ]);
    });

    it("should use the auth value if passed", async () => {
      (axios as any).mockResolvedValueOnce({
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      });

      const params = basicDeliveryParams({ auth: "Basic 123456" });
      const templates = { plain: "" };

      await expect(sendHandler(params, templates)).resolves.toEqual({
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      });

      expect((axios as any).mock.calls[0][0]).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Basic 123456" }),
        })
      );
    });

    it("should support overrides", async () => {
      const mockResponse = {
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      };
      const mockOverride = {
        body: {
          hasOverride: true,
        },
        headers: {
          "X-HAS-OVERRIDE": "true",
        },
        method: "put",
        timeout: 10000,
        timeoutErrorMessage: "Webhook API request timed out.",
        url: "https://my-override-url.com",
      };

      (axios as any).mockResolvedValueOnce(mockResponse);

      const params = basicDeliveryParams(undefined, undefined, mockOverride);

      const templates = { plain: "" };

      await expect(sendHandler(params, templates)).resolves.toEqual(
        mockResponse
      );

      expect((axios as any).mock.calls[0]).toEqual([
        {
          data: expect.objectContaining(mockOverride.body),
          headers: expect.objectContaining(mockOverride.headers),
          method: mockOverride.method,
          timeout: 10000,
          timeoutErrorMessage: "Webhook API request timed out.",
          url: mockOverride.url,
        },
      ]);
    });

    it("should support profile settings", async () => {
      const mockResponse = {
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      };
      const mockProfile = {
        authentication: {
          mode: "basic",
          password: "EverythingIsAWESOME!1!!!",
          username: "emmit",
        },
        headers: {
          "X-PROFILE-HEADER": "true",
        },
        method: "put",
        profile: "expanded",
        timeout: 10000,
        timeoutErrorMessage: "Webhook API request timed out.",
        url: "https://my-override-url.com",
      };

      (axios as any).mockResolvedValueOnce(mockResponse);

      const params = basicDeliveryParams(
        { getConfigFromProfile: true },
        undefined,
        undefined,
        { webhook: mockProfile }
      );

      const templates = {
        payload: {
          data: {},
        },
      };

      await expect(sendHandler(params, templates)).resolves.toEqual(
        mockResponse
      );

      expect((axios as any).mock.calls[0]).toEqual([
        {
          data: expect.any(Object),
          headers: expect.objectContaining({
            Authorization: "Basic ZW1taXQ=:RXZlcnl0aGluZ0lzQVdFU09NRSExISEh",
            ...mockProfile.headers,
          }),
          method: mockProfile.method,
          timeout: 10000,
          timeoutErrorMessage: "Webhook API request timed out.",
          url: mockProfile.url,
        },
      ]);
    });

    it("should support profile bearer token", async () => {
      const mockResponse = {
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      };
      const mockProfile = {
        authentication: {
          mode: "bearer",
          token: "abc-xyz-1234",
        },
      };

      (axios as any).mockResolvedValueOnce(mockResponse);

      const params = basicDeliveryParams(
        { getConfigFromProfile: true },
        undefined,
        undefined,
        { webhook: mockProfile }
      );

      const templates = { plain: "" };

      await expect(sendHandler(params, templates)).resolves.toEqual(
        mockResponse
      );

      expect((axios as any).mock.calls[0]).toEqual([
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer abc-xyz-1234",
          }),
        }),
      ]);
    });

    it("should have profile auth override integration auth", async () => {
      const mockResponse = {
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      };
      const mockProfile = {
        authentication: {
          mode: "none",
        },
      };

      (axios as any).mockResolvedValueOnce(mockResponse);

      const params = basicDeliveryParams(
        { auth: "Bearer zyx-cba-4321", getConfigFromProfile: true },
        undefined,
        undefined,
        { webhook: mockProfile }
      );

      const templates = { plain: "" };

      await expect(sendHandler(params, templates)).resolves.toEqual(
        mockResponse
      );

      expect((axios as any).mock.calls[0]).toEqual([
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: "Bearer zyx-cba-4321",
          }),
        }),
      ]);
    });
  });

  describe("handles", () => {
    it("should always be true if not dynamic", () => {
      expect(webhook.handles({ config: {} as any, profile: {} })).toBe(true);
    });

    it("should require a webhook url if dynamic", () => {
      expect(
        webhook.handles({
          config: { json: { getConfigFromProfile: true } } as any,
          profile: { webhook: {} },
        })
      ).toBe(false);
    });

    it("should be true when webhook url present", () => {
      expect(
        webhook.handles({
          config: { json: { getConfigFromProfile: true } } as any,
          profile: { webhook: { url: "https://example.com" } },
        })
      ).toBe(true);
    });
  });
});
