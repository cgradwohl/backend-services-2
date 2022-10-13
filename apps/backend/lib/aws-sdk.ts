import { Agent } from "https";
import AWSXRay from "aws-xray-sdk-core";

const XRAY_EXCLUDE_ENV = ["production"];

const AWS = XRAY_EXCLUDE_ENV.includes(process.env.NODE_ENV)
  ? require("aws-sdk")
  : AWSXRay.captureAWS(require("aws-sdk"));

const agent = new Agent({
  keepAlive: true,
  maxSockets: Infinity,
  rejectUnauthorized: true,
});
// @ts-ignore: this failure is a false positive
agent.setMaxListeners(0);

AWS.config.update({
  httpOptions: {
    agent,
    connectTimeout: 1000,
    timeout: 5 * 1000,
  },
  maxRetries: 3,
});

export default AWS;
