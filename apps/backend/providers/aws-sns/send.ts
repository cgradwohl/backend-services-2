import { AWSError, SNS } from "aws-sdk";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import { IConfigurationJson } from "~/types.api";
import {
  ProviderConfigurationError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "../errors";
import { DeliveryHandler } from "../types";
import { IAwsSnsConfig, regions } from "./types";

function assertAwsSnsConfig(
  config: IConfigurationJson
): asserts config is IAwsSnsConfig {
  if (config.provider !== "aws-sns") {
    throw new Error(
      `Incorrect Configuration for aws-sns. Received ${config.provider}.`
    );
  }

  if (
    !config.accessKeyId ||
    typeof config.accessKeyId !== "string" ||
    !config.accessKeyId.length
  ) {
    throw new ProviderConfigurationError("No Access Key ID specified.");
  } else if (
    !config.secretAccessKey ||
    typeof config.secretAccessKey !== "string" ||
    !config.secretAccessKey.length
  ) {
    throw new ProviderConfigurationError("No Secret Key specified.");
  }

  if (config?.region) {
    const snsConfig = config as IAwsSnsConfig;
    const region =
      typeof snsConfig?.region === "string"
        ? snsConfig.region
        : snsConfig?.region?.value;

    if (!region) {
      throw new ProviderConfigurationError("Invalid region type");
    }

    if (!regions.includes(region)) {
      throw new ProviderConfigurationError(
        `Specified region ${region} is invalid. See https://docs.aws.amazon.com/general/latest/gr/rande.html#region-names-codes.`
      );
    }
  }
}

function assertPublishBody(
  body: SNS.Types.PublishInput
): asserts body is SNS.Types.PublishInput {
  if (
    !body.PhoneNumber?.length &&
    !body.TargetArn?.length &&
    !body.TopicArn?.length
  ) {
    throw new ProviderConfigurationError(
      "Invalid SNS destination. SNS requires a valid or Phone Number, Target ARN, or Topic ARN."
    );
  }
}

const send: DeliveryHandler = async (params, templates) => {
  const { config, profile } = params;

  assertAwsSnsConfig(config);

  // Supports override of Access Key Id and Secret Access Key
  const accessKeyId =
    params?.override?.config?.accessKeyId ?? config.accessKeyId;
  const secretAccessKey =
    params?.override?.config?.secretAccessKey ?? config.secretAccessKey;
  const configRegion =
    typeof config?.region === "string" ? config.region : config?.region?.value;
  const region =
    params?.override?.config?.region ?? configRegion ?? "us-east-1";

  // profile topic arn takes precedence
  const topicArn = params?.override?.config?.topicArn ?? config?.topicArn;

  /**
   * See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#publish-property
   * SNS supports sending notifications via PhoneNumber(SMS), TargetArn(mobile push) and TopicArn(mobile push).
   * For now only PhoneNumber and TopicArn are supported.
   */
  let body: SNS.Types.PublishInput = {
    Message: templates.plain,
    PhoneNumber: profile?.phone_number as string,
    TargetArn: (profile as any).aws_sns?.target_arn as string,
    TopicArn: topicArn,
  };

  if (params.override && params.override.body) {
    body = jsonMerger.mergeObjects([body, params.override.body]);
  }

  // validate body and overrides
  assertPublishBody(body);

  try {
    const sns = new SNS({
      accessKeyId,
      apiVersion: "2010-12-01",
      region,
      secretAccessKey,
    });

    if (body.PhoneNumber?.length) {
      body.TargetArn = undefined;
      body.TopicArn = undefined;
    } else if (body.TopicArn?.length) {
      body.PhoneNumber = undefined;
      body.TargetArn = undefined;
    } else {
      body.PhoneNumber = undefined;
      body.TopicArn = undefined;
    }

    const res = await sns.publish(body).promise();

    return res;
  } catch (err) {
    if ((err as AWSError)?.retryable) {
      throw new RetryableProviderResponseError(err);
    }

    throw new ProviderResponseError(err);
  }
};

export default send;
