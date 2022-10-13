import { SendMessageBatchRequestEntryList } from "aws-sdk/clients/sqs";
import AWS from "~/lib/aws-sdk";

const sqs = new AWS.SQS();

function enqueue<T>(queueName: string, delaySeconds?: number) {
  return async (message: T) => {
    const queueUrl = await sqs
      .getQueueUrl({
        QueueName: queueName,
      })
      .promise();
    return sqs
      .sendMessage({
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl.QueueUrl,
        DelaySeconds: delaySeconds ?? 0,
      })
      .promise();
  };
}

export function enqueueByQueueUrl<T>(queueUrl: string, delaySeconds?: number) {
  return (message: T) =>
    sqs
      .sendMessage({
        DelaySeconds: delaySeconds ?? 0,
        MessageBody: JSON.stringify(message),
        QueueUrl: queueUrl,
      })
      .promise();
}

export function enqueueBatches(queueUrl: string) {
  return (entries: SendMessageBatchRequestEntryList) => {
    return sqs
      .sendMessageBatch({
        Entries: entries,
        QueueUrl: queueUrl,
      })
      .promise();
  };
}

export default enqueue;
