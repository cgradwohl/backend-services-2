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

const axiosHeaders = {
  Authorization: `Bearer ${process.env.COURIER_AUTH_TOKEN}`,
  "Content-Type": "application/json",
};

const USER_ID = "SMOKEY";

const wait = (waitTime?: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, waitTime ?? 5000);
  });

describe("send api v2 - banner", () => {
  let messageId: string;
  let archiveTrackingId: string;

  test(
    `can send content`,
    async () => {
      const data: RequestV2 = {
        message: {
          content: {
            version: "2022-01-01",
            elements: [
              {
                type: "meta",
                title: "English Title",
                locales: {
                  "eu-fr": {
                    title: "French Title",
                  },
                },
              },
              {
                type: "text",
                content: "English Body",
                locales: {
                  "eu-fr": {
                    content: "French Body",
                  },
                },
              },
            ],
          },
          routing: {
            method: "single",
            channels: ["banner"],
          },
          to: {
            user_id: USER_ID,
            courier: {
              channel: USER_ID,
            },
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

  const getBannersQuery = `
    query GetBanners($params: BannerParamsInput, $limit: Int = 10, $after: String){
      banners(params: $params, limit: $limit, after: $after) {
        nodes {
          content {
            title
            body
            trackingIds {
              archiveTrackingId
            }
          } 
        }
      }
    }
  `;

  test(
    `can verify message sent`,
    async () => {
      await wait();

      let attempts = 10;
      let messageStatus;

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
    `can request banners`,
    async () => {
      await wait();

      const result = await axios({
        url: `${process.env.API_URL}/client/q`,
        method: "post",
        headers: {
          "x-courier-client-key": process.env.COURIER_CLIENT_KEY,
          "x-courier-user-id": USER_ID,
        },
        data: {
          query: getBannersQuery,
        },
      });

      const content = result?.data?.data?.banners?.nodes?.[0]?.content;
      archiveTrackingId = content.trackingIds.archiveTrackingId;
      expect(archiveTrackingId).toBeTruthy();
      expect(content?.title).toBe("English Title");
      expect(content?.body.trim()).toBe("English Body");
    },
    JEST_TIMEOUT
  );

  test(
    `can request banners with locale`,
    async () => {
      await wait();

      const result = await axios({
        url: `${process.env.API_URL}/client/q`,
        method: "post",
        headers: {
          "x-courier-client-key": process.env.COURIER_CLIENT_KEY,
          "x-courier-user-id": USER_ID,
        },
        data: {
          variables: {
            params: {
              locale: "eu-fr",
            },
          },
          query: getBannersQuery,
        },
      });

      const content = result?.data?.data?.banners?.nodes?.[0]?.content;
      expect(content?.title).toBe("French Title");
      expect(content?.body.trim()).toBe("French Body");
    },
    JEST_TIMEOUT
  );

  test(
    `can archive message`,
    async () => {
      await wait();

      await axios({
        url: `${process.env.API_URL}/client/q`,
        method: "post",
        headers: {
          "x-courier-client-key": process.env.COURIER_CLIENT_KEY,
          "x-courier-user-id": USER_ID,
        },
        data: {
          variables: {
            trackingId: archiveTrackingId,
          },
          query: `
            mutation TrackEvent($trackingId: String!) {
              trackEvent(trackingId: $trackingId) {
                id
              }
            }
          `,
        },
      });
    },
    JEST_TIMEOUT
  );

  test(
    `banners should be empty`,
    async () => {
      await wait();

      const getBannerCount = async () => {
        const result = await axios({
          url: `${process.env.API_URL}/client/q`,
          method: "post",
          headers: {
            "x-courier-client-key": process.env.COURIER_CLIENT_KEY,
            "x-courier-user-id": USER_ID,
          },
          data: {
            query: getBannersQuery,
          },
        });

        return result?.data?.data?.banners?.nodes?.length;
      };

      let bannerCount;

      try {
        bannerCount = await getBannerCount();
        let attempts = 10;

        while (bannerCount > 0 && attempts) {
          await wait();
          bannerCount = await getBannerCount();
          attempts = attempts - 1;
        }
      } catch (ex) {
        console.log(`error getting banner count`, ex);
      }

      expect(bannerCount).toBe(0);
    },
    JEST_TIMEOUT
  );
});
