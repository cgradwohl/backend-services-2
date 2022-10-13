import {
  generateTemplateV1Routing,
  getTemplateV1RoutingSummary,
} from "../get-template-v1-routing";
import {
  simpleNotification,
  profile,
  providers,
  pushNotification,
  preferences,
  complexFailoverNotification,
} from "./models";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");

describe("get template v1 routing", () => {
  describe("main routing generator", () => {
    it("should generate a routing tree from a notification", async () => {
      expect.assertions(1);
      const tree = await generateTemplateV1Routing({
        templateV1: complexFailoverNotification,
        providers,
        variableData: {
          profile: {
            email: "drew@email.com",
            phone_number: "12086021111",
            apn: {
              token: "YOUR TOKEN",
            },
            firebaseToken:
              "MTI2MjAwMzQ3OTMzQHByb2plY3RzLmdjbS5hbmFTeUIzcmNaTmtmbnFLZEZiOW1oekNCaVlwT1JEQTJKV1d0dw==",
          },
        } as any,
      });
      expect(tree).toMatchSnapshot();
    });
  });

  describe("routing summary generator", () => {
    it("should produce the correct routing summary", async () => {
      expect.assertions(1);
      const summary = await getTemplateV1RoutingSummary({
        templateV1: simpleNotification,
        providers,
        variableData: { profile } as any,
      });
      expect(summary).toMatchSnapshot();
    });

    it("should respect user preferences", async () => {
      expect.assertions(3);
      const summary = await getTemplateV1RoutingSummary({
        templateV1: simpleNotification,
        providers,
        preferences,
        variableData: { profile } as any,
      });
      expect(summary.bestOf.length).toBe(1);
      expect(summary.bestOf[0]?.channel).toBe("email");
      expect(summary.bestOf[0]?.selected).toBe(true);
    });

    it("should pass tokens to handles functions", async () => {
      expect.assertions(1);
      const summary = await getTemplateV1RoutingSummary({
        templateV1: pushNotification,
        providers,
        variableData: { profile } as any,
        tokens: {
          "firebase-fcm": [{ token: "hello!" } as any],
          apn: [{ token: "hello!" } as any],
        },
      });
      expect(summary).toMatchSnapshot();
    });
  });
});
