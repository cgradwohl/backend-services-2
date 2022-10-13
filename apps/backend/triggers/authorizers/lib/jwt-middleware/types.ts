import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";

export interface JwtMiddlewareMap {
  [resource: string]: {
    /** Permissions the token must have by http method */
    [method: string]: JwtMiddleware[];
  };
}

/**
 * Middleware that checks the JWT payload against the request.
 * Should call unauthorized (~/lib/unauthorized) if payload lacks necessary permissions */
export interface JwtMiddleware {
  (opts: JwtMiddlewareOpts): Promise<void>;
}

export interface JwtMiddlewareOpts {
  event: APIGatewayRequestAuthorizerEvent;
  jwtPayload: { [key: string]: any };
}
