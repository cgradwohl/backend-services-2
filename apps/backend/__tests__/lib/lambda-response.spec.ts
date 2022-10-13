import { BadRequest } from "~/lib/http-errors";
import {
  ApiRequestContext,
  assertBody,
  assertPathParam,
} from "~/lib/lambda-response";
import { ApiVersion } from "~/send/types";

export const API_GATEWAY_PROXY_EVENT = {
  body: null,
  headers: {},
  httpMethod: "POST",
  isBase64Encoded: false,
  multiValueHeaders: {},
  multiValueQueryStringParameters: {},
  path: "",
  pathParameters: { id: "id" },
  queryStringParameters: {},
  requestContext: null,
  resource: "resource",
  stageVariables: {},
};

export const apiRequestContext: ApiRequestContext = {
  apiVersion: "2019-04-01",
  event: { ...API_GATEWAY_PROXY_EVENT },
  scope: "published/production",
  tenantId: "a-tenantId",
  useMaterializedBrands: false,
  translateToV2: false,
  shouldTranslateAndDeliver: false,
  shouldUseRouteTree: false,
};

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const apiVersion: ApiVersion = "2019-04-01";
const useMaterializedBrands = false;
const translateToV2 = false;
const shouldTranslateAndDeliver = false;
const shouldUseRouteTree = false;

describe("when asserting the body", () => {
  [null, "", undefined].forEach((testCase) => {
    it("will throw BadRequest if empty body and allow empty false", () => {
      const context = {
        apiVersion,
        event: { ...API_GATEWAY_PROXY_EVENT, body: testCase },
        useMaterializedBrands,
        translateToV2,
        shouldTranslateAndDeliver,
        shouldUseRouteTree,
      };

      expect(() => assertBody(context)).toThrow(BadRequest);
    });
  });

  it(`will throw BadRequest if body has key wrapped with smart quote`, () => {
    const context = {
      apiVersion,
      event: { ...API_GATEWAY_PROXY_EVENT, body: '{“key“:"value"}' },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(() => assertBody(context)).toThrow(BadRequest);
  });

  it(`will throw BadRequest if body contains invalid JSON structure`, () => {
    const context = {
      apiVersion,
      event: { ...API_GATEWAY_PROXY_EVENT, body: "{`1`:`value`}" },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(() => assertBody(context)).toThrow(BadRequest);
  });

  [null, "", undefined].forEach((testCase) => {
    it("will return {} if empty body and allow empty true", () => {
      const context = {
        apiVersion,
        event: { ...API_GATEWAY_PROXY_EVENT, body: testCase },
        useMaterializedBrands,
        translateToV2,
        shouldTranslateAndDeliver,
        shouldUseRouteTree,
      };

      expect(assertBody(context, { allowEmptyBody: true })).toEqual({});
    });
  });

  it("will return parsed JSON if string is stringified JSON", () => {
    const context = {
      apiVersion,
      event: { ...API_GATEWAY_PROXY_EVENT, body: '{"answer":"42"}' },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(assertBody(context, { allowEmptyBody: true })).toEqual({
      answer: "42",
    });
  });

  it("will return parsed array if top-level JSON text is an array", () => {
    const context = {
      apiVersion,
      event: { ...API_GATEWAY_PROXY_EVENT, body: '[{"answer":"42"}]' },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(assertBody(context, { allowEmptyBody: true })).toEqual([
      {
        answer: "42",
      },
    ]);
  });

  it("will return parsed JSON if string is a query string", () => {
    const context = {
      apiVersion,
      event: { ...API_GATEWAY_PROXY_EVENT, body: "answer=42" },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(assertBody(context, { allowEmptyBody: true })).toEqual({
      answer: "42",
    });
  });
});

describe("when asserting path parameters", () => {
  it("will throw a Bad Request if a key missing", () => {
    const context = {
      apiVersion,
      event: { ...API_GATEWAY_PROXY_EVENT, pathParameters: {} },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(() => assertPathParam(context, "id")).toThrow(BadRequest);
  });

  it("will throw a Bad Request if a key contains undefined", () => {
    const context = {
      apiVersion,
      event: {
        ...API_GATEWAY_PROXY_EVENT,
        pathParameters: { id: "undefined" },
      },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(() => assertPathParam(context, "id")).toThrow(BadRequest);
  });

  it("will throw a Bad Request if a key contains null", () => {
    const context = {
      apiVersion,
      event: { ...API_GATEWAY_PROXY_EVENT, pathParameters: { id: " null " } },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(() => assertPathParam(context, "id")).toThrow(BadRequest);
  });

  it("will return the expected key", () => {
    const context = {
      apiVersion,
      event: { ...API_GATEWAY_PROXY_EVENT, pathParameters: { id: "hootyhoo" } },
      useMaterializedBrands,
      translateToV2,
      shouldTranslateAndDeliver,
      shouldUseRouteTree,
    };

    expect(assertPathParam(context, "id")).toBe("hootyhoo");
  });
});
