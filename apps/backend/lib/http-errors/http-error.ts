import { APIGatewayProxyResult } from "aws-lambda";
import { BaseError } from "make-error";

import responseFactory from "~/lib/response-factory";
import REQUIRED_SECURITY_HEADERS from "../required-security-headers";
import { ErrorType, IErrorHeaders, IErrorOptions } from "./types";

const STATUS_CODE_TYPES = {
  400: "invalid_request_error",
  404: "invalid_request_error",
  405: "invalid_request_error",
  409: "invalid_request_error",
  401: "authentication_error",
  402: "authorization_error",
  403: "authorization_error",
  429: "rate_limit_error",
  500: "api_error",
};

export default class HttpError extends BaseError {
  public static createResponse(
    statusCode: number,
    message: string,
    type: ErrorType,
    options?: { headers?: IErrorHeaders }
  ): APIGatewayProxyResult {
    return responseFactory.make(
      statusCode,
      {
        message: HttpError.isClientError(statusCode)
          ? message
          : "Internal Server Error",
        type,
      },
      {
        headers: {
          ...(options?.headers ?? {}),
          ...REQUIRED_SECURITY_HEADERS,
        },
      }
    );
  }

  public static getErrorType(statusCode: number): ErrorType {
    return STATUS_CODE_TYPES[statusCode] ?? "api_error";
  }

  public static isClientError(statusCode: number): boolean {
    return statusCode >= 400 && statusCode <= 499;
  }

  // tslint:disable-next-line: variable-name
  protected _code?: string;
  // tslint:disable-next-line: variable-name
  protected _docUrl?: string;
  // tslint:disable-next-line: variable-name
  protected _headers?: IErrorHeaders;
  // tslint:disable-next-line: variable-name
  protected _statusCode: number;
  // tslint:disable-next-line: variable-name
  protected _type: ErrorType;

  get code(): string {
    return this._code;
  }

  get docUrl(): string {
    return this._docUrl;
  }

  get headers(): IErrorHeaders {
    return this._headers;
  }

  get isClientError(): boolean {
    return HttpError.isClientError(this._statusCode);
  }

  get statusCode(): number {
    return this._statusCode;
  }

  get type(): ErrorType {
    return this._type;
  }

  constructor(message: string, options: IErrorOptions) {
    super(message);

    // this._docUrl = getDocUrl(type);
    this._headers = options.headers;
    this._statusCode = options.statusCode;
    this._type = options.type;
  }

  public createResponse() {
    return HttpError.createResponse(this.statusCode, this.message, this.type, {
      headers: this.headers,
    });
  }
}
