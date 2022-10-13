import mockClient from "nodemailer";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import sendHandler from "~/providers/smtp/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("nodemailer");

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

describe("smtp provider", () => {
  let sendStub: jest.Mock;
  describe("send", () => {
    const profile = {
      email: "to@mail.com",
    };

    const config = {
      fromAddress: "fromAddress",
      host: "host",
      password: "password",
      username: "username",
    };

    const params = getDeliveryParams(config, { profile });

    const template = {
      bcc: "bcc@mail.com",
      cc: "cc@mail.com",
      from: "from@mail.com",
      html: "",
      replyTo: "replyTo@mail.com",
      subject: "",
      text: "",
    };

    beforeEach(async () => {
      sendStub = jest.fn();
      (mockClient.createTransport as jest.Mock).mockReturnValue({
        sendMail: jest.fn(),
        verify: jest.fn(),
      });

      await sendHandler(params, template);
    });

    it("should override transport config", () => {
      expect(mockClient.createTransport).toBeCalledWith({
        auth: {
          pass: "password",
          user: "username",
        },
        host: "host",
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });
    });
  });

  describe("overrides", () => {
    const profile = {
      email: "to@mail.com",
    };

    const config = {
      fromAddress: "fromAddress",
      host: "host",
      password: "password",
      username: "username",
    };

    const params = getDeliveryParams(config, { profile });
    params.override = {
      config: {
        auth: {
          pass: "pass-override",
          user: "user-override",
        },
        host: "host-override",
        secure: true,
        socketTimeout: 10000,
      },
    };

    const template = {
      bcc: "bcc@mail.com",
      cc: "cc@mail.com",
      from: "from@mail.com",
      html: "",
      replyTo: "replyTo@mail.com",
      subject: "",
      text: "",
    };

    beforeEach(async () => {
      sendStub = jest.fn();
      (mockClient.createTransport as jest.Mock).mockReturnValue({
        sendMail: jest.fn(),
        verify: jest.fn(),
      });

      await sendHandler(params, template);
    });

    it("should override transport config", () => {
      expect(mockClient.createTransport).toBeCalledWith({
        auth: {
          pass: "pass-override",
          user: "user-override",
        },
        host: "host-override",
        secure: true,
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });
    });
  });
});
