import {
  BadPatchRequestError,
  BrandNotFoundError,
  BrandNotPublishedError,
  CannotArchiveDefaultBrandError,
  DuplicateBrandIdError,
} from "~/lib/brands";
import {
  MoreRecentVersionExistsError,
  ObjectAlreadyExistsError,
  ObjectNotPublishedError,
} from "~/lib/dynamo/object-service/publishable";
import { BadCursor } from "~/lib/elastic-search/messages";
import { PreparationError, RoutingError } from "~/lib/errors";
import handleError from "~/lib/handle-error-log";
import {
  BadRequest,
  Conflict,
  MethodNotAllowed,
  NotFound,
  PaymentRequired,
} from "~/lib/http-errors";
import logger from "~/lib/logger";
import { Errors } from "~/lib/message-service/errors";
import {
  MissingBrandEmailSettingsError,
  MissingBrandError,
} from "~/lib/notifications/apply-brand";
import {
  CheckDeliveryStatusError,
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/get-environment-variable");

jest.mock("~/lib/logger", () => {
  return {
    CourierLogger: jest.fn().mockImplementation(() => {
      return {
        logger: jest.fn(),
      };
    }),
    error: jest.fn(),
    warn: jest.fn(),
  };
});

jest.mock("~/lib/get-launch-darkly-flag", () => {
  return {
    getFeatureTenantVariation: () => false,
  };
});

// Not exhaustive, but commons used in code
const warnCases: Error[] = [
  new BadRequest(),
  new Conflict(),
  new Errors.MessageNotFoundError(),
  new MethodNotAllowed(),
  new NotFound(),
  new PaymentRequired(),
  new ProviderConfigurationError(),
  new ProviderResponseError("yikes"),
  new CheckDeliveryStatusError(),
  new RoutingError(),
  new PreparationError(),
  new RetryableProviderResponseError(new Error()),
];

const makeErrorCases: Error[] = [
  // Brand Related
  new BadPatchRequestError(),
  new BrandNotFoundError(),
  new BrandNotPublishedError(),
  new CannotArchiveDefaultBrandError(),
  new DuplicateBrandIdError(),
  // Publishable
  new MoreRecentVersionExistsError(),
  new ObjectAlreadyExistsError(),
  new ObjectNotPublishedError(),
  // ElasticSearch
  new BadCursor(),
  // Apply Brand
  new MissingBrandError(),
  new MissingBrandEmailSettingsError(),
];

const errorCases: Error[] = [
  new Error(),
  new TypeError(),
  new ReferenceError(),
];

describe("when handling error", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  warnCases.forEach((err) => {
    it(`will use warn log for ${err}`, () => {
      handleError(err);

      expect((logger.error as jest.Mock).mock.calls.length).toBe(0);
      expect((logger.warn as jest.Mock).mock.calls.length).toBe(1);
    });
  });

  errorCases.concat(makeErrorCases).forEach((err) => {
    it(`will use error log for ${err}`, () => {
      handleError(err);

      expect((logger.error as jest.Mock).mock.calls.length).toBe(1);
      expect((logger.warn as jest.Mock).mock.calls.length).toBe(0);
    });
  });
});
