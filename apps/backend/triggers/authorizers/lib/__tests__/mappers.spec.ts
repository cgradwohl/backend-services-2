import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import { mapUserIdFromIdPathParam } from "../mappers";

describe("authorizer mappers", () => {
  describe("mapUserIdFromIdPathParam", () => {
    it("should extract the user id from id path param", () => {
      const event: Partial<APIGatewayRequestAuthorizerEvent> = {
        pathParameters: {
          id: "userId",
        },
      };
      expect(mapUserIdFromIdPathParam(event as any)).toEqual("userId");
    });
  });
});
