import axios, { AxiosError } from "axios";
import captureException from "~/lib/capture-exception";
import enqueue from "~/lib/enqueue";
import { InternalCourierError } from "~/lib/errors";
import { OutboundWebhookEventBody } from "../types";

/**
 * changing the FINAL_RETRY_ATTEMPT requires a change to the
 * DLQs redrive policy.
 * our FINAL_RETRY_ATTEMPT is the 298th attempt, therefore
 * we send to DLQ on the 297th retry attempt.
 */
const FINAL_RETRY_ATTEMPT = 298;

export const enqueueSendWebhookQueue = (params: {
  body: OutboundWebhookEventBody;
  delaySeconds: number;
  retrySchedule: number;
}) => {
  const { body, delaySeconds, retrySchedule } = params;

  const service = enqueue<OutboundWebhookEventBody>(
    process.env.SEND_WEBHOOK_QUEUE_NAME,
    delaySeconds
  );

  return service({ ...body, retrySchedule });
};

const getRetrySchedule = (body: OutboundWebhookEventBody) => {
  const retrySchedule = body?.retrySchedule ?? 0;

  if (retrySchedule === FINAL_RETRY_ATTEMPT) {
    // do not retry past the 298th (3 Day) schedule
    return false;
  }

  return retrySchedule + 1;
};

const classifyRetryableError = (error: Error): boolean => {
  if (error instanceof InternalCourierError) {
    return true;
  }

  if (axios.isAxiosError(error)) {
    const status = (error as AxiosError)?.response?.status;

    // retry any 3xx, 4xx, 5xx error
    const first = Number(String(status)[0]);
    return [3, 4, 5].includes(first) ? true : false;
  }

  return false;
};

const getDelaySecondsBySchedule = (schedule: number) => {
  const interval = schedule ?? 0;
  switch (true) {
    case interval <= 5:
      return 0; // 0 min
    case interval === 6:
      return 60; // 1 min
    case interval === 7:
      return 60; // 1 min
    case interval === 8:
      return 120; // 2 min
    case interval === 9:
      return 180; // 3 min
    case interval === 10:
      return 300; // 5 min
    case interval === 11:
      return 600; // 10 min
    default:
      return 900; // 15 min
  }
};

// handle event exception
// the event is retryable, then retry it
// otherwise return
export const handleException = async (
  body: OutboundWebhookEventBody,
  error: Error
): Promise<void> => {
  const isRetryableError = classifyRetryableError(error);

  if (isRetryableError === false) {
    // then error is not retryable
    await captureException(error);
    return;
  }

  const retrySchedule = getRetrySchedule(body);

  if (retrySchedule === false) {
    // then (3 Day) retry schedule has expired
    await captureException(error);
    return;
  }

  const delaySeconds = getDelaySecondsBySchedule(retrySchedule);

  await enqueueSendWebhookQueue({
    body,
    delaySeconds,
    retrySchedule,
  });

  return;
};
