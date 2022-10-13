import makeError from "make-error";

export type GetFn = (
  tenantId: string,
  idempotencyKey: string
) => Promise<IIdempotentRequest>;

export interface IIdempotentRequest {
  body: string;
  idempotencyKey: string;
  statusCode: number;
  tenantId: string;
  ttl: number;
}

interface IPutFnOptions {
  ttl?: number;
}

export type PutFn = (
  tenantId: string,
  idempotencyKey: string,
  response: {
    body: string;
    statusCode: number;
  },
  options?: IPutFnOptions
) => Promise<IIdempotentRequest>;

export type UpdateFn = (
  tenantId: string,
  idempotencyKey: string,
  response: {
    body: string;
    statusCode: number;
  }
) => Promise<void>;

export const DuplicateIdempotentRequestError = makeError(
  "DuplicateIdempotentRequestError"
);
