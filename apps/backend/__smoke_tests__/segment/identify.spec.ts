import dotenv from "dotenv";
dotenv.config({ path: "__smoke_tests__/.env" });

import { CourierClient } from "@trycourier/courier";
import axios, { AxiosRequestConfig } from "axios";
import uuid from "uuid";

const JEST_TIMEOUT = 60000;

const recipientId = "mockRecipientId";

const courier = CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN,
  baseUrl: process.env.API_URL,
});

const axiosHeaders = {
  Authorization: `Bearer ${process.env.COURIER_AUTH_TOKEN}`,
  "Content-Type": "application/json",
};

const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });

describe("segment identify event", () => {
  const SEGMENT_EVENT = {
    anonymousId: uuid.v4(),
    messageId: uuid.v4(),
    receivedAt: Date.now().toString(),
    timestamp: Date.now().toString(),
    traits: {
      immatrait: "immavalue",
    },
    type: "identify",
    userId: recipientId,
  };

  test("can replaceProfile", async () => {
    const response = await courier.replaceProfile({
      recipientId,
      profile: {
        immatrait: undefined,
      },
    });

    expect(response).toEqual({ status: "SUCCESS" });
  });

  test(
    `can send segment identify request`,
    async () => {
      const options: AxiosRequestConfig = {
        data: SEGMENT_EVENT,
        headers: axiosHeaders,
        method: "POST",
        url: `${process.env.API_URL}/inbound/segment`,
      };

      const response = await axios.request(options);
      expect(response.status).toBe(202);
    },
    JEST_TIMEOUT
  );

  test(
    `can verify profile updated`,
    async () => {
      await wait();
      const response = (await courier.getProfile({
        recipientId,
      })) as {
        profile: {
          immatrait: string;
        };
      };

      expect(response.profile.immatrait).toEqual(
        SEGMENT_EVENT.traits.immatrait
      );
    },
    JEST_TIMEOUT
  );
});
