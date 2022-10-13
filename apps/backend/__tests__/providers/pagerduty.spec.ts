import axios from "axios";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import pagerduty from "~/providers/pagerduty";
import sendHandler from "~/providers/pagerduty/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios");
const axiosSpy = axios as any as jest.Mock;

const basicDeliveryParams = (
  config?: any,
  body: any = { profile: {} }
): DeliveryHandlerParams => {
  const variableData = {
    event: "",
    recipient: "",
    ...body,
  };
  const variableHandler = createVariableHandler({ value: variableData });
  const linkHandler = createLinkHandler({});

  return {
    config: {
      ...config,
      provider: "",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe("pagerduty provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an event action", async () => {
      const params = basicDeliveryParams({ eventAction: "acknowledge" });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "Invalid Event Action specified. Valid Event Actions are trigger."
      );
    });

    it("should require a routing key", async () => {
      const params = basicDeliveryParams({ eventAction: "trigger" });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Routing Key specified."
      );
    });

    it("should require a source", async () => {
      const params = basicDeliveryParams({
        eventAction: "trigger",
        routingKey: "1a",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Source specified."
      );
    });

    it("should require a severity", async () => {
      const params = basicDeliveryParams({
        eventAction: "trigger",
        routingKey: "1a",
        source: "source",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "Invalid Severity specified. Valid Severities are info, warning, error, and critical."
      );
    });

    it("should respect `routing_key` coming from profile object", async () => {
      axiosSpy.mockResolvedValue({
        status: 200,
        data: {},
      });
      const params = basicDeliveryParams(
        {
          eventAction: "trigger",
          routingKey: "1a",
          source: "source",
          severity: "info",
        },
        {
          profile: {
            pagerduty: {
              routing_key: "2b",
            },
          },
        }
      );
      const templates = { plain: "" };
      await sendHandler(params, templates);
      expect(axiosSpy).toBeCalledTimes(1);
      expect(axiosSpy).toHaveBeenCalledWith({
        data: {
          event_action: "trigger",
          images: [],
          links: [],
          payload: {
            severity: "info",
            source: "source",
            summary: "",
          },
          routing_key: "2b",
        },
        headers: {
          "Content-Type": "application/json",
        },
        method: "post",
        timeout: 10000,
        timeoutErrorMessage: "PagerDuty API request timed out.",
        url: "https://events.pagerduty.com/v2/enqueue",
      });
    });
  });

  describe("handles", () => {
    it("should return true", () => {
      expect(
        pagerduty.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(true);
    });
  });
});
