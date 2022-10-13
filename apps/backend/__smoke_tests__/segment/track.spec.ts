import dotenv from "dotenv";
dotenv.config({ path: "__smoke_tests__/.env" });

import { CourierClient } from "@trycourier/courier";
import axios, { AxiosRequestConfig } from "axios";
import uuid from "uuid";
import { emailEvents } from "../fixtures";

const JEST_TIMEOUT = 60000;

const recipientId = "mockRecipientId";

const courier = CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN,
  baseUrl: process.env.API_URL,
});

const smokeTestEmail =
  process.env.SMOKE_TEST_EMAIL || "trycourier@litmusemail.com";

const axiosHeaders = {
  Authorization: `Bearer ${process.env.COURIER_AUTH_TOKEN}`,
  "Content-Type": "application/json",
};

const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });

describe("segment track event", () => {
  let messageId;
  const SEGMENT_EVENT = {
    anonymousId: uuid.v4(),
    event: "SEGMENT_TRACK_EVENT",
    messageId: uuid.v4(),
    receivedAt: Date.now().toString(),
    timestamp: Date.now().toString(),
    type: "track",
    userId: recipientId,
  };

  test("can replaceProfile", async () => {
    const response = await courier.replaceProfile({
      recipientId,
      profile: {
        email: smokeTestEmail,
      },
    });

    expect(response).toEqual({ status: "SUCCESS" });
  });

  test("can setup eventmap", async () => {
    const payload = {
      id: emailEvents[0],
      type: "notification",
    };

    if (!payload.id) {
      throw new Error("Missing Email Event");
    }

    const options: AxiosRequestConfig = {
      data: payload,
      headers: axiosHeaders,
      method: "PUT",
      url: `${process.env.API_URL}/events/Segment-TrackEvent:SEGMENT_TRACK_EVENT`,
    };

    const response = await axios.request(options);
    expect(response.data).toEqual(payload);
  });

  test(
    `can send segment track request`,
    async () => {
      const options: AxiosRequestConfig = {
        data: SEGMENT_EVENT,
        headers: axiosHeaders,
        method: "POST",
        url: `${process.env.API_URL}/inbound/segment`,
      };

      const response = await axios.request(options);
      messageId = response.data.messageId;
      expect(messageId).toBeDefined();
    },
    JEST_TIMEOUT
  );

  test(
    `can verify message sent`,
    async () => {
      let messageStatus;

      if (!messageId) {
        throw new Error("Missing messageId");
      }

      let attempts = 10;
      while (
        (!messageStatus || messageStatus?.status === "ENQUEUED") &&
        attempts
      ) {
        await wait();
        try {
          messageStatus = await courier.getMessage(messageId);
          // console.log(messageStatus);
        } catch (ex) {
          // TODO: Should we do something here? Why swallow it?
          console.log(`error getting message, ${messageId}:`);
        }

        attempts = attempts - 1;
      }

      expect(
        ["SENT", "DELIVERED", "OPENED", "CLICKED"].includes(
          messageStatus.status
        )
      ).toBe(true);
    },
    JEST_TIMEOUT
  );

  test(
    `idempotency will return the same messageid`,
    async () => {
      await wait();

      const options: AxiosRequestConfig = {
        data: SEGMENT_EVENT,
        headers: axiosHeaders,
        method: "POST",
        url: `${process.env.API_URL}/inbound/segment`,
      };

      const response = await axios.request(options);
      expect(messageId).toEqual(response.data.messageId);
    },
    JEST_TIMEOUT
  );
});
