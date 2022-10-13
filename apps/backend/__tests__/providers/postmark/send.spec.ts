import axios from "axios";
import sendHandler from "~/providers/postmark/send";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios");

const getDeliveryParams = (
  config?: any,
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
      ...config,
      provider: "",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe("send", () => {
  const profile = {
    email: "to@mail.com",
  };

  const config = {
    apiKey: "mockApiKey",
  };

  const params = getDeliveryParams(config, {
    profile,
  });

  const template = {
    bcc: "test2 bcc@mail.com, test3 <bcc@mail2.com>",
    cc: "test cc@mail.com",
    from: "from@mail.com",
    html: "",
    replyTo: "replyTo@mail.com",
    subject: "",
    text: "",
  };

  afterEach(jest.resetAllMocks);

  it("should call axios", async () => {
    (axios as any).mockResolvedValue({
      data: {},
      status: 200,
      headers: {},
      statusText: "OK",
    });
    await sendHandler(params, template);
    expect(axios).toHaveBeenCalledTimes(1);
    const expectedPayload = {
      data: {
        Bcc: '"test2" bcc@mail.com,"test3" bcc@mail2.com',
        Cc: '"test" cc@mail.com',
        From: "from@mail.com",
        HtmlBody: "",
        ReplyTo: "replyTo@mail.com",
        Subject: "",
        TextBody: "",
        To: "to@mail.com",
      },
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": "mockApiKey",
      },
      method: "POST",
      timeout: 10000,
      timeoutErrorMessage: "Postmark API Request timed out",
      url: "https://api.postmarkapp.com/email",
    };
    expect(axios).toHaveBeenCalledWith(expectedPayload);
  });
});
