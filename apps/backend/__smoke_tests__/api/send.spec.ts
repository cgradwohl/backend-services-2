import dotenv from "dotenv";
dotenv.config({ path: "__smoke_tests__/.env" });
import { CourierClient } from "@trycourier/courier";
import axios, { AxiosRequestConfig } from "axios";
import { RequestV2 } from "../../api/send/types";

const JEST_TIMEOUT = 60000;

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

import { emailEvents } from "../fixtures";

const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });

describe("send api v1", () => {
  emailEvents.forEach((eventId) => {
    let messageId;

    test(
      `can send email notification: ${eventId}`,
      async () => {
        const response = await courier.send({
          data: {},
          eventId,
          profile: {
            email: smokeTestEmail,
          },
          recipientId: "@smoketest",
        });

        messageId = response.messageId;
        expect(messageId).toBeDefined();
      },
      JEST_TIMEOUT
    );

    test(
      `can retrieve message`,
      async () => {
        await wait();

        let attempts = 10;
        let messageStatus = await courier.getMessage(messageId);
        while (messageStatus.status === "ENQUEUED" && attempts) {
          await wait();
          messageStatus = await courier.getMessage(messageId);
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
  });
});

describe("send api v2 - email", () => {
  let messageId;
  let messageHistory;
  let renderedEvent;

  test(
    `can send inline content`,
    async () => {
      const data: RequestV2 = {
        message: {
          content: {
            version: "2022-01-01",
            elements: [
              { type: "meta", title: "Hello, {{name}}" },
              { type: "text", content: "Good Day!" },
              {
                type: "action",
                href: "https://www.courier.com",
                align: "center",
                background_color: "#9d3789",
                style: "button",
                content: "Click Me!",
              },
            ],
          },
          data: {
            name: "Smokey",
          },
          brand: {
            version: "2022-05-17",
            colors: {
              primary: "#344563",
              secondary: "#C1B6DD",
              tertiary: "#E85178",
            },
            logo: {
              image: "https://via.placeholder.com/150",
              href: "app.courier.com",
            },
          },
          to: { email: smokeTestEmail },
          routing: {
            method: "single",
            channels: ["email"],
          },
        },
      };
      const options: AxiosRequestConfig = {
        data,
        headers: axiosHeaders,
        method: "POST",
        url: `${process.env.API_URL}/send`,
      };

      const response = await axios.request(options);
      messageId = response.data.requestId;
      console.log("messageId", messageId);
      expect(messageId).toBeDefined();
    },
    JEST_TIMEOUT
  );

  test(
    `can verify message sent`,
    async () => {
      await wait();

      let messageStatus;
      let attempts = 10;
      try {
        messageStatus = await courier.getMessage(messageId);
        while (messageStatus.status === "ENQUEUED" && attempts) {
          await wait();
          messageStatus = await courier.getMessage(messageId);
          attempts = attempts - 1;
        }
      } catch (ex) {
        console.log(`error getting message, ${messageId}:`, ex);
      }

      console.log("messageStatus", messageStatus);
      expect(
        ["SENT", "DELIVERED", "OPENED", "CLICKED"].includes(
          messageStatus.status
        )
      ).toBe(true);
    },
    JEST_TIMEOUT
  );

  test(
    `can get message history`,
    async () => {
      const options: AxiosRequestConfig = {
        headers: axiosHeaders,
        method: "GET",
        url: `${process.env.API_URL}/messages/${messageId}/history`,
      };

      let attempts = 10;
      let response;

      const doRequest = async () => {
        response = await axios.request(options);
      };

      while (!response && attempts) {
        try {
          await wait();
          await doRequest();
        } catch (ex) {
          console.log(`error getting message history, ${messageId}:`, ex);
        }

        attempts = attempts - 1;
      }

      messageHistory = response.data.results;
      expect(messageHistory.some((item) => item.type === "ENQUEUED")).toBe(
        true
      );

      renderedEvent = messageHistory.find((item) => item.type === "RENDERED");
      expect(renderedEvent).toBeTruthy();

      expect(messageHistory.some((item) => item.type === "SENT")).toBe(true);
    },
    JEST_TIMEOUT
  );

  test(
    `can get rendered html`,
    async () => {
      const hrefRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
      const imgSrcRegex = /<img\s+(?:[^>]*?\s+)?src=(["'])(.*?)\1/g;
      const options: AxiosRequestConfig = {
        headers: {
          ...axiosHeaders,
          "content-type": "text/html",
        },
        method: "GET",
        url: `${process.env.API_URL}${renderedEvent.output.html}`,
      };

      const response = await axios.request(options);
      const body = response.data
        .replace(hrefRegex, '<a href="REPLACED"')
        .replace(imgSrcRegex, '<img src="REPLACED"');

      expect(body).toMatchSnapshot();
    },
    JEST_TIMEOUT
  );

  test(
    `can get rendered subject`,
    async () => {
      const options: AxiosRequestConfig = {
        headers: {
          ...axiosHeaders,
          "content-type": "text/html",
        },
        method: "GET",
        url: `${process.env.API_URL}${renderedEvent.output.subject}`,
      };

      const response = await axios.request(options);
      expect(response.data).toMatchSnapshot();
    },
    JEST_TIMEOUT
  );
});
