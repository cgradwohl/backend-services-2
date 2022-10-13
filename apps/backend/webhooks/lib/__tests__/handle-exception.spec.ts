import axios, { AxiosError } from "axios";
import { InternalCourierError } from "~/lib/errors";
import { OutboundWebhookEventBody } from "~/webhooks/types";
import * as captureException from "~/lib/capture-exception";
import * as HandleExpectionModule from "../handle-exception";

jest.mock("~/lib/capture-exception");
const handleException = HandleExpectionModule.handleException;

jest.spyOn(axios, "isAxiosError").mockImplementation(() => true);

const enqueueSendWebhookQueueSpy = jest
  .spyOn(HandleExpectionModule, "enqueueSendWebhookQueue")
  .mockImplementation(async () => jest.fn());

const captureExceptionSpy = jest
  .spyOn(captureException, "default")
  .mockImplementation(jest.fn());

describe("handleException - non-retryable exceptions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should not retry if the AxiosError has a non retryable status code", async () => {
    const body = {} as unknown as OutboundWebhookEventBody;

    const error = {
      config: {},
      request: {},
      response: {
        status: 202,
      },
    } as AxiosError<any>;

    await handleException(body, error);

    expect(enqueueSendWebhookQueueSpy).not.toHaveBeenCalled();
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledTimes(0);
    expect(captureExceptionSpy).toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledTimes(1);
  });

  it("should not retry if the error is a generic error", async () => {
    const body = {} as unknown as OutboundWebhookEventBody;

    const error = new Error("oops");

    await handleException(body, error);

    expect(enqueueSendWebhookQueueSpy).not.toHaveBeenCalled();
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledTimes(0);
    expect(captureExceptionSpy).toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledTimes(1);
  });
});
describe("handleException - retryable exceptions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should retry on first failure", async () => {
    const body = {
      mock: "mock",
      // on first failure, we have done 0 retries, i.e. retrySchedule is undefined
      retrySchedule: undefined,
    } as unknown as OutboundWebhookEventBody;

    const error = {
      config: {},
      request: {},
      response: {
        status: 408,
      },
    } as AxiosError<any>;

    await handleException(body, error);

    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalled();
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledTimes(1);
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledWith({
      body,
      delaySeconds: 0,
      // on first failure the retrySchedule was 0 (undefined)
      // we retry with the "retrySchedule + 1"
      retrySchedule: 1,
    });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledTimes(0);
  });

  it("should retry on the 10th failure", async () => {
    const body = {
      mock: "mock",
      // on 10th failure, we have done 10 retries, i.e. retrySchedule is 10
      retrySchedule: 10,
    } as unknown as OutboundWebhookEventBody;

    const error = {
      config: {},
      request: {},
      response: {
        status: 408,
      },
    } as AxiosError<any>;

    await handleException(body, error);

    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalled();
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledTimes(1);
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledWith({
      body,
      delaySeconds: 600,
      // on 10th failure the retrySchedule was 10
      // we retry with the "retrySchedule + 1"
      retrySchedule: 11,
    });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledTimes(0);
  });

  it("should retry on the 100th attempt", async () => {
    const body = {
      mock: "mock",
      // on 100th failure, we have done 100 retries, i.e. retrySchedule is 100
      retrySchedule: 100,
    } as unknown as OutboundWebhookEventBody;

    const error = {
      config: {},
      request: {},
      response: {
        status: 408,
      },
    } as AxiosError<any>;

    await handleException(body, error);

    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalled();
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledTimes(1);
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledWith({
      body,
      delaySeconds: 900,
      // on 100th failure the retrySchedule was 100
      // we retry with the "retrySchedule + 1"
      retrySchedule: 101,
    });
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledTimes(0);
  });

  it("should NOT retry on the 298th attempt", async () => {
    const body = {
      mock: "mock",
      // on 298th failure, we have done 298 retries, i.e. retrySchedule is 298
      retrySchedule: 298,
    } as unknown as OutboundWebhookEventBody;

    const error = {
      config: {},
      request: {},
      response: {
        status: 408,
      },
    } as AxiosError<any>;

    await handleException(body, error);

    expect(enqueueSendWebhookQueueSpy).not.toHaveBeenCalled();
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledTimes(0);
    expect(captureExceptionSpy).toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledTimes(1);
  });

  it("should retry if the error is an InternalCourierError", async () => {
    const body = {} as unknown as OutboundWebhookEventBody;

    const error = new InternalCourierError();

    await handleException(body, error);

    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalled();
    expect(enqueueSendWebhookQueueSpy).toHaveBeenCalledTimes(1);
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledTimes(0);
  });
});
