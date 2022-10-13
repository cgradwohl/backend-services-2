import axios from "axios";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { ProviderResponseError } from "~/providers/errors";
import * as formHelper from "~/providers/mailgun/create-form-data";
import sendHandler from "~/providers/mailgun/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios");

const axiosPostSpy = jest.spyOn(axios, "post");

const createFormDataSpy = jest.spyOn(formHelper, "createFormData");

const getDeliveryParams = (
  testConfig?: any,
  body: any = { profile: {} }
): DeliveryHandlerParams => {
  const variableData = {
    event: "",
    recipient: "",
    ...body,
  };

  const variableHandler = createVariableHandler({ value: variableData });
  const linkHandler = createLinkHandler({});

  return {
    config: {
      ...testConfig,
      provider: "",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

const config = {
  apiKey: "mockApiKey",
  domain: "mockDomain",
};
const profile = {
  email: "to@mail.com",
};

const params = getDeliveryParams(config, {
  profile,
});

const template = {
  bcc: "bcc@mail.com",
  cc: "cc@mail.com",
  from: "from@mail.com",
  html: "",
  replyTo: "replyTo@mail.com",
  subject: "",
  text: "",
};
const expectedMailgunResponse = {
  data: {
    id: "<20211013230936.1.C913CB59DE255FB1@sandboxea24b22d01174cfc9c9ea70959d6b274.mailgun.org>",
    message: "Queued. Thank you.",
  },
};

describe("mailgun basic send", () => {
  beforeEach(() => {
    axiosPostSpy.mockResolvedValue(expectedMailgunResponse);
  });
  afterAll(() => {
    createFormDataSpy.mockReset();
  });

  it("all with correct keys", async () => {
    const response = await sendHandler(params, template);
    expect(response).toMatchObject(expectedMailgunResponse.data);
    expect(axiosPostSpy.mock.calls[0][0]).toMatch(
      "https://api.mailgun.net/v3/mockDomain/messages"
    );
    const { replyTo, ...rest } = template;
    expect(createFormDataSpy).toHaveBeenCalledWith({
      ...rest,
      "h:Reply-To": "replyTo@mail.com",
      to: "to@mail.com",
    });
  });
});

describe("mailgun overrides send", () => {
  beforeAll(() => {
    axiosPostSpy.mockResolvedValue(expectedMailgunResponse);

    params.override = {
      body: {
        "o:tag": "notifications",
      },
      config: {
        apiKey: "newApiKey",
        host: "newHost",
      },
    };
  });

  afterAll(() => {
    createFormDataSpy.mockReset();
    params.override = undefined;
  });

  it("send should respect overrides", async () => {
    const response = await sendHandler(params, template);

    expect(axiosPostSpy.mock.calls[0][0]).toMatch(
      "https://api.mailgun.net/v3/mockDomain/messages"
    );

    expect(response).toMatchObject(expectedMailgunResponse.data);

    expect(Object.keys(axiosPostSpy.mock.calls[0][2])).toMatchSnapshot(
      "should match headers"
    );

    expect(createFormDataSpy.mock.calls[0][0]).toMatchSnapshot(
      "should match form data"
    );

    expect(
      axiosPostSpy.mock.calls[0][2].headers["content-type"].startsWith(
        "multipart/form-data"
      )
    ).toBeTruthy();
  });
});

describe("mailgun attachents send", () => {
  beforeEach(() => {
    axiosPostSpy.mockResolvedValue(expectedMailgunResponse);
  });

  it("mailgun should get attachments", async () => {
    params.override = {
      attachments: [
        {
          contentType: "application/pdf",
          data: "Q29uZ3JhdHVsYXRpb25zLCB5b3UgY2FuIGJhc2U2NCBkZWNvZGUh",
          filename: "billing.pdf",
        },
      ],
    };
    await sendHandler(params, template);

    const expectedFormDataInput = [
      "from",
      "h:Reply-To",
      "html",
      "subject",
      "text",
      "to",
      "attachment",
      "cc",
      "bcc",
    ];

    const actualFormDataInput = Object.keys(createFormDataSpy.mock.calls[0][0]);
    expect(actualFormDataInput).toMatchObject(expectedFormDataInput);
  });
});

describe("mailgun incorrect domain errors", () => {
  beforeEach(() => {
    axiosPostSpy.mockResolvedValue({
      data: "Mailgun Magnificent API",
    });
  });

  it("should throw providerResponseError", async () => {
    await expect(sendHandler(params, template)).rejects.toThrow(
      ProviderResponseError
    );
  });
});
