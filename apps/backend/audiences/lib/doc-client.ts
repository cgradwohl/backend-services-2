import { Agent } from "https";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const agent = new Agent({
  keepAlive: true,
  maxSockets: Infinity,
  rejectUnauthorized: true,
});

export const getDocClient = () =>
  new DocumentClient({
    httpOptions: {
      agent,
      connectTimeout: 10000,
      timeout: 5 * 1000,
    },
    maxRetries: 3,
  });
