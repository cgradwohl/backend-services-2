import { IApiAuthorizerContext } from "./lambda-access-policy";
import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent } from "aws-lambda";
import { parseISO } from "date-fns";
import { ResponseOverrides } from "lambda-response-template";
import qs from "qs";
import { TenantRouting, TenantScope } from "~/types.internal";

import roles from "~/lib/user-roles";
import {
  BadRequest,
  Forbidden,
  HttpError,
  Unauthorized,
} from "../lib/http-errors";
import * as tenantAccessRightsService from "../lib/tenant-access-rights-service";
import { ApiErrorResponse } from "../types.public.d";
import { IRole } from "./access-control/types";

import { ApiVersion } from "~/send/types";
import { extractErrors } from "./ajv";
import captureException from "./capture-exception";
import * as idempotentRequests from "./idempotent-requests";
import {
  DuplicateIdempotentRequestError,
  IIdempotentRequest,
} from "./idempotent-requests/types";
import responseFactory from "./response-factory";

export interface RawRequestContext {
  apiVersion: ApiVersion;
  /**
   * The type of authentication used for the request.
   * Notes:
   * - client-key is public. So should only be used to access public things
   * - client-hmac does not have scoped permissions. Prefer client-jwt.
   */
  authType?: RequestAuthType;
  /** Contains scoped permissions like read:message write:user-tokens etc. Space separated list */
  authScope?: string;
  event: APIGatewayProxyEvent;
  scope?: TenantScope;
  userId?: string;
  /** Comma separated list of userIds the request is trying to read/modify */
  userIds?: string;
  userPoolId?: string;
  tenantId?: string;
  dryRunKey?: TenantRouting;
  useMaterializedBrands: boolean;
  translateToV2: boolean;
  shouldTranslateAndDeliver: boolean;
  shouldUseRouteTree: boolean;
}

export type RequestAuthType =
  | "client-jwt"
  | "client-hmac"
  | "client-key"
  | "api-key";

export type ApiRequestContext = RawRequestContext & {
  scope: TenantScope;
  tenantId: string;
};

export type CognitoRequestContext = RawRequestContext & {
  role: IRole;
  tenantId: string;
  userId: string;
};

export interface Response<TOutput> {
  body?: TOutput;
  headers?: ResponseOverrides["headers"];
  status?: number;
  transform?: (value: TOutput) => unknown;
}

export type HandlerRawCallback<TOutput> = (
  context: RawRequestContext
) => Promise<Response<TOutput>>;
export type HandlerApiCallback<TOutput> = (
  context: ApiRequestContext
) => Promise<Response<TOutput>>;
export type HandlerCognitoCallback<TOutput> = (
  context: CognitoRequestContext
) => Promise<Response<TOutput>>;

interface IUserContext {
  apiVersion: ApiVersion;
  userId?: string;
  userPoolId?: string;
  tenantId?: string;
  email?: string;
  scope?: TenantScope;
  dryRunKey?: TenantRouting;
  useMaterializedBrands: boolean;
  translateToV2: boolean;
  shouldTranslateAndDeliver: boolean;
  shouldUseRouteTree: boolean;
}

export const getRequestHeader = (
  context: ApiRequestContext,
  headerName: string
) => {
  for (const header in context?.event?.headers) {
    if (header.toLowerCase() !== headerName.toLowerCase()) {
      continue;
    }

    const value = context.event.headers[header];
    return !value || !value.trim() ? undefined : encodeURIComponent(value);
  }
};

export const getUserContext = ({ requestContext, queryStringParameters }) => {
  const userContext: IUserContext = {
    // setting default version
    apiVersion: "2019-04-01",
    useMaterializedBrands: false,
    translateToV2: false,
    shouldTranslateAndDeliver: false,
    shouldUseRouteTree: false,
  };
  const {
    authorizer,
  }: {
    authorizer: IApiAuthorizerContext & {
      claims?: {
        email: string;
        "cognito:username": string;
        iss: string;
      };
    };
  } = requestContext;

  if (authorizer && authorizer.claims) {
    userContext.email = authorizer.claims.email;
    userContext.userId = authorizer.claims["cognito:username"];
    userContext.userPoolId = authorizer.claims.iss.split(".com/")[1];
  }

  if (authorizer && authorizer.tenantId) {
    userContext.tenantId = authorizer.tenantId;
    userContext.scope = authorizer.scope;
    userContext.dryRunKey = authorizer.dryRunKey;
    userContext.apiVersion = authorizer.apiVersion;
    userContext.useMaterializedBrands =
      authorizer.useMaterializedBrandsString === "true";
    userContext.translateToV2 = authorizer.translateToV2String === "true";
    userContext.shouldTranslateAndDeliver =
      authorizer.shouldTranslateAndDeliverString === "true";
    userContext.shouldUseRouteTree =
      authorizer.shouldUseRouteTreeString === "true";
  } else if (queryStringParameters) {
    userContext.tenantId = queryStringParameters.tenantId;
  }

  return userContext;
};

export const verifyUserContext = async (userContext) => {
  if (!userContext.userId || !userContext.tenantId) {
    throw new Unauthorized();
  }

  const accessRight = await tenantAccessRightsService.get({
    tenantId: userContext.tenantId,
    userId: userContext.userId,
  });

  if (!accessRight) {
    throw new Forbidden();
  }

  return accessRight;
};

export function handleRaw<TOutput>(callbackRaw: HandlerRawCallback<TOutput>) {
  return async (event: APIGatewayProxyEvent) => {
    try {
      const userContext = getUserContext(event);
      const context: RawRequestContext = {
        event,
        apiVersion: "2019-04-01",
        useMaterializedBrands: false,
        translateToV2: false,
        shouldTranslateAndDeliver: false,
        ...userContext,
      };

      const res = await callbackRaw(context);
      const overrides: ResponseOverrides = res.headers
        ? { headers: res.headers }
        : undefined;
      if (res.transform) {
        overrides.transform = res.transform as (value: TOutput) => string;
      }

      return responseFactory.make(res.status || 200, res.body, overrides);
    } catch (err) {
      const statusCode = err.status ?? err.statusCode ?? 500;
      const isClientError = HttpError.isClientError(statusCode);

      if (!isClientError) {
        await captureException(err, {
          request: event,
          user: event.requestContext.authorizer,
        });
      }

      if (err instanceof HttpError) {
        return err.createResponse();
      }

      const message = isClientError ? err.message : "Internal Server Error";
      const type = HttpError.getErrorType(statusCode);
      return HttpError.createResponse(statusCode, message, type);
    }
  };
}

export function handleApi<TOutput>(
  callback: HandlerApiCallback<TOutput | ApiErrorResponse>
) {
  return handleRaw<TOutput | ApiErrorResponse>(async (rawContext) => {
    if (!rawContext.tenantId) {
      throw new Unauthorized();
    }

    const context: ApiRequestContext = {
      apiVersion: rawContext.apiVersion ?? "2019-04-01",
      event: rawContext.event,
      scope: rawContext.scope,
      dryRunKey: rawContext.dryRunKey,
      tenantId: rawContext.tenantId,
      useMaterializedBrands: rawContext.useMaterializedBrands ?? false,
      translateToV2: rawContext.translateToV2 ?? false,
      shouldTranslateAndDeliver: rawContext.shouldTranslateAndDeliver ?? false,
      shouldUseRouteTree: rawContext.shouldUseRouteTree,
    };
    return callback(context);
  });
}

export function handleCognito<TOutput>(
  callback: HandlerCognitoCallback<TOutput>
) {
  return handleRaw<TOutput>(async (context) => {
    const accessRight = await verifyUserContext(context);
    const role = await roles(context.tenantId).get(accessRight.role);

    return callback({
      ...context,
      role,
    } as CognitoRequestContext);
  });
}

const getIdempotencyKey = (context: ApiRequestContext) => {
  // other methods should be idempotent by definition
  if (context?.event?.httpMethod !== "POST") {
    return undefined;
  }

  for (const header in context?.event?.headers) {
    if (header.toLowerCase() === "idempotency-key") {
      const value = context.event.headers[header];

      if (!value || !value.trim()) {
        return undefined;
      }

      const idempotencyKey = encodeURIComponent(value);
      const path = encodeURIComponent(context.event.path);
      return `${idempotencyKey}/${path}`;
    }
  }
};

const getIdempotencyExpiration = (context: ApiRequestContext) => {
  for (const header in context?.event?.headers) {
    if (header.toLowerCase() === "x-idempotency-expiration") {
      const value = context.event.headers[header];

      if (!value || !value.trim()) {
        return undefined;
      }

      const expiration = !Number.isNaN(parseISO(value).getTime())
        ? parseISO(value).getTime()
        : Number.parseInt(value, 10);

      if (Number.isNaN(expiration)) {
        throw new BadRequest("Expiration is not a valid date");
      }

      return expiration;
    }
  }
};

export function handleIdempotentApi<TOutput>(
  callback: HandlerApiCallback<TOutput | ApiErrorResponse>
) {
  return handleApi<TOutput | ApiErrorResponse>(async (context) => {
    const idempotencyKey = getIdempotencyKey(context);

    // no idempotencyKey found, allow request execution
    if (!idempotencyKey) {
      return callback(context);
    }

    let existingRequest: IIdempotentRequest;
    try {
      const idempotencyExpiration = getIdempotencyExpiration(context);

      await idempotentRequests.put(
        context.tenantId,
        idempotencyKey,
        {
          // we would not have these during the first attempt
          // it gets patched after executing the callback function
          body: undefined,
          statusCode: undefined,
        },
        { ttl: idempotencyExpiration }
      );
    } catch (err) {
      // idempotent request found
      if (err instanceof DuplicateIdempotentRequestError) {
        existingRequest = await idempotentRequests.get(
          context.tenantId,
          idempotencyKey
        );
        return {
          body:
            existingRequest.body && typeof existingRequest.body === "string"
              ? JSON.parse(existingRequest.body)
              : existingRequest.body,
          status: existingRequest.statusCode || 202,
        };
      }
      // bubble up the unexpected errors
      throw err;
    }

    // idempotent request not found, allow request execution
    const response = await callback(context);

    // save the new response
    await idempotentRequests.update(context.tenantId, idempotencyKey, {
      body: response.body ? JSON.stringify(response.body) : undefined,
      statusCode: response.status || 202,
    });

    return response;
  });
}

export function assertBody<TBody>(
  context: RawRequestContext,
  options: { allowEmptyBody?: boolean; validateFn?: ValidateFunction } = {}
): TBody | null {
  const { allowEmptyBody, validateFn } = options;

  if (context.event.body && typeof context.event.body !== "string") {
    // for running locally
    return context.event.body;
  }

  if (!allowEmptyBody && (!context.event.body || !context.event.body.length)) {
    throw new BadRequest("No Body Provided");
  }

  const raw = context.event.body || "{}";
  const leadingChar = raw.trim()[0];
  try {
    const body: TBody =
      leadingChar === "{" || leadingChar === "["
        ? JSON.parse(raw)
        : qs.parse(raw);

    if (validateFn) {
      const valid = validateFn(body);

      if (!valid) {
        const errors = extractErrors(
          validateFn.schema,
          body,
          validateFn.errors
        );

        throw new BadRequest(
          Array.isArray(errors)
            ? errors
                .map(({ error }) => error)
                .join("\n")
                .trim()
                .replace(/\/|:/g, "")
            : JSON.stringify(errors)
        );
      }
    }

    return body;
  } catch (err) {
    if (err instanceof SyntaxError && err.message.match(/[\u201C\u201D]/)) {
      const msg =
        "Body contains a key or value wrapped in a smart quote. Switch the smart quote to a straight quote.";
      throw new BadRequest(msg);
    }

    if (err instanceof SyntaxError) {
      throw new BadRequest(err.message);
    }

    throw err;
  }
}

export function assertAuthToken(context: RawRequestContext) {
  if (!context.event.headers || !context.event.headers.Authorization) {
    throw new Unauthorized();
  }

  const authorizationHeader = context.event.headers.Authorization;
  const [, mode, authToken] = authorizationHeader.match(/(Bearer|Basic) (.*)/);
  if (!authToken) {
    throw new Unauthorized();
  }

  switch (mode) {
    case "Bearer":
      return authToken;
    case "Basic": {
      const buff = new Buffer(authToken, "base64");
      const pair = buff.toString("ascii");
      const [, authToken2] = pair.split(":");
      return authToken2;
    }
    default:
      throw new Unauthorized();
  }
}

export function assertPathParam(
  context: RawRequestContext,
  key: string
): string {
  if (!context.event.pathParameters?.[key]) {
    throw new BadRequest(`No Path Parameter ${key} Provided`);
  }

  if (
    ["undefined", "null"].includes(context.event.pathParameters[key].trim())
  ) {
    throw new BadRequest(`Path Parameter ${key} cannot be undefined or null`);
  }

  return decodeURI(context.event.pathParameters[key]);
}

export function assertAndDecodePathParam(
  context: RawRequestContext,
  key: string
) {
  return decodeURI(assertPathParam(context, key));
}

export function getQueryParam(
  context: RawRequestContext,
  key: string
): string | undefined {
  if (
    !context.event.queryStringParameters ||
    !context.event.queryStringParameters[key]
  ) {
    return undefined;
  }
  return context.event.queryStringParameters[key];
}
