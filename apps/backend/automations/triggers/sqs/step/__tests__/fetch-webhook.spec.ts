import axios from "axios";
import { IFetchDataStep } from "~/automations/types";
import { fetchWebhook } from "../fetch-data";

jest.mock("~/automations/lib/idempotentStep", () => jest.fn());
jest.mock("~/automations/lib/services/enqueue", () => jest.fn());
jest.mock("~/automations/lib/services/runs", () => jest.fn());
jest.mock("~/automations/lib/services/steps", () => jest.fn());
jest.mock("~/lib/get-launch-darkly-flag", () => jest.fn());
jest.mock("axios", () =>
  jest.fn((params) => {
    if (params.url === "success-case") {
      return Promise.resolve({ data: "foobarbaz" });
    }

    return Promise.reject("oops");
  })
);

describe("fetch webhook", () => {
  it("should return data from the webhook given a successful response", async () => {
    const webhookConfig: IFetchDataStep["webhook"] = {
      body: {},
      headers: {},
      params: {},
      method: "GET",
      url: "success-case",
    };
    const data = await fetchWebhook({ webhookConfig });

    expect(data).toStrictEqual({ data: "foobarbaz" });
  });

  test("it should return an empty object given a failure response", async () => {
    jest.mock("axios", () =>
      jest.fn(() => Promise.reject({ data: "foobarbaz" }))
    );

    const webhookConfig: IFetchDataStep["webhook"] = {
      body: {},
      headers: {},
      params: {},
      method: "GET",
      url: "failure-case",
    };
    const data = await fetchWebhook({ webhookConfig });

    expect(data).toStrictEqual({ data: {} });
  });
});
