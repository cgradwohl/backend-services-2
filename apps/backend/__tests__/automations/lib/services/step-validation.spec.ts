import validationSchemas from "~/automations/schemas";
const schemas = validationSchemas({ additionalProperties: false });

describe("Validate Send Step", () => {
  it("must return true for a valid send step", () => {
    const sendStep = {
      action: "send",
      template: "templateId",
      recipient: "abc",
      profile: {
        email: "email@gmail.com",
      },
    };
    expect(schemas.send(sendStep)).toBe(true);
  });

  it("must return true for a valid send step with accessors", () => {
    const sendStep = {
      action: "send",
      brand: {
        $ref: "data.myBrand",
      },
      data: {
        foo: {
          bar: {
            baz: {
              $ref: "data.my.nested.prop",
            },
          },
        },
      },
      template: "Template",
      recipient: {
        $ref: "recipient",
      },
    };
    expect(schemas.send(sendStep)).toBe(true);
  });

  it("must throw error if required nonempty argument is missing in send step", () => {
    const sendStep = {
      action: "send",
      template: "",
      recipient: "abc",
      profile: {
        email: "email@gmail.com",
      },
    };
    expect(schemas.send(sendStep)).toBe(false);
    expect(schemas.send.errors[0].message).toBe(
      "must NOT have fewer than 1 characters"
    );
  });

  it("must throw error if required argument template is missing", () => {
    const sendStep = {
      action: "send",
      recipient: "abc",
      profile: {
        email: "email@gmail.com",
      },
    };
    expect(schemas.send(sendStep)).toBe(false);
    expect(schemas.send.errors[0].message).toBe(
      "must have required property 'template'"
    );
  });

  it("must throw error if required argument recipient is missing", () => {
    const sendStep = {
      action: "send",
      template: "templateId",
      profile: {
        email: "email@gmail.com",
      },
    };
    expect(schemas.send(sendStep)).toBe(false);
    expect(schemas.send.errors[0].message).toBe(
      "must have required property 'recipient'"
    );
  });
});

describe("Validate Send-List Step", () => {
  it("must return true for a valid send-list step", () => {
    const sendListStep = {
      action: "send-list",
      template: "templateId",
      list: "listId",
      data: { data: "value" },
    };
    expect(schemas["send-list"](sendListStep)).toBe(true);
  });

  it("must throw error if extra element is present in send-list step", () => {
    const sendListStep = {
      action: "send-list",
      template: "templateId",
      list: "listId",
      data: { data: "value" },
      extra: 1,
    };
    expect(schemas["send-list"](sendListStep)).toBe(false);
    expect(schemas["send-list"].errors[0].message).toBe(
      "must NOT have additional properties"
    );
  });

  it("must throw error if required argument template is missing", () => {
    const sendListStep = {
      action: "send-list",
      list: "listId",
    };
    expect(schemas["send-list"](sendListStep)).toBe(false);
    expect(schemas["send-list"].errors[0].message).toBe(
      "must have required property 'template'"
    );
  });

  it("must throw error if required argument list is missing", () => {
    const sendListStep = {
      action: "send-list",
      template: "templateId",
    };
    expect(schemas["send-list"](sendListStep)).toBe(false);
    expect(schemas["send-list"].errors[0].message).toBe(
      "must have required property 'list'"
    );
  });
});

describe("Validate Delay Step", () => {
  it("must return true for a valid delay step", () => {
    const delayStep = {
      action: "delay",
      duration: "1 minute",
    };
    expect(schemas.delay(delayStep)).toBe(true);
  });

  it("must throw error if missing required element", () => {
    const delayStep = {
      action: "delay",
    };
    expect(schemas.delay(delayStep)).toBe(false);
    expect(schemas.delay.errors.length).toBe(5); //error in each of the 4 cases plus 1 for not matching overall
    expect(schemas.delay.errors[0].message).toBe(
      "must have required property 'duration'"
    );
  });
});

describe("Validate Invoke Step", () => {
  it("must return true for a valid invoke step", () => {
    const invokeStep = {
      action: "invoke",
      template: "templateId",
      context: {
        recipient: "recipientId",
      },
    };
    expect(schemas.invoke(invokeStep)).toBe(true);
  });

  it("must throw error if invalid type of attribute", () => {
    const invokeStep = {
      action: "invoke",
      template: "templateId",
      context: {
        recipient: 1,
      },
    };
    expect(schemas.invoke(invokeStep)).toBe(false);
    expect(schemas.invoke.errors[0].message).toBe("must be string");
  });

  it("must throw error if required argument template is missing", () => {
    const invokeStep = {
      action: "invoke",
    };
    expect(schemas.invoke(invokeStep)).toBe(false);
    expect(schemas.invoke.errors[0].message).toBe(
      "must have required property 'template'"
    );
  });
});

describe("Validate Cancel Step", () => {
  it("must return true for a valid cancel step", () => {
    const cancelStep = {
      action: "cancel",
      cancelation_token: "token",
    };
    expect(schemas.cancel(cancelStep)).toBe(true);
  });

  it("must throw error if has both cancelation tokens", () => {
    const cancelStep = {
      action: "cancel",
      cancelation_token: "token",
      cancelationToken: "token",
    };
    expect(schemas.cancel(cancelStep)).toBe(false);
    expect(schemas.cancel.errors[2].message).toBe(
      "must match a schema in anyOf"
    );
  });

  it("must throw error if missing required cancelation_token or cancelationToken argument", () => {
    const cancelStep = {
      action: "cancel",
    };
    expect(schemas.cancel(cancelStep)).toBe(false);
    expect(schemas.cancel.errors[0].message).toBe(
      "must have required property 'cancelation_token'"
    );
  });
});

describe("Validate Fetch Data Step", () => {
  it("must return true for a valid fetch-data step", () => {
    const fetchDataStep = {
      action: "fetch-data",
      webhook: {
        url: "https://somewebhook.com",
        headers: {},
        method: "get",
      },
      merge_strategy: "replace",
    };
    expect(schemas["fetch-data"](fetchDataStep)).toBe(true);
  });

  it("must throw error if has no url", () => {
    const fetchDataStep = {
      action: "fetch-data",
      webhook: {
        headers: {},
        method: "get",
      },
      merge_strategy: "replace",
    };
    expect(schemas["fetch-data"](fetchDataStep)).toBe(false);
    expect(schemas["fetch-data"].errors[0].message).toBe(
      "must have required property 'url'"
    );
  });

  it("must throw error if required argument webhook is missing", () => {
    const fetchDataStep = {
      action: "fetch-data",
      merge_strategy: "replace",
    };
    expect(schemas["fetch-data"](fetchDataStep)).toBe(false);
    expect(schemas["fetch-data"].errors[0].message).toBe(
      "must have required property 'webhook'"
    );
  });

  it("must throw error if required argument merge_strategy is missing", () => {
    const fetchDataStep = {
      action: "fetch-data",
      webhook: {
        url: "https://somewebhook.com",
        headers: {},
        method: "get",
      },
    };
    expect(schemas["fetch-data"](fetchDataStep)).toBe(false);
    expect(schemas["fetch-data"].errors[0].message).toBe(
      "must have required property 'merge_strategy'"
    );
  });
});

describe("Validate Update Profile Step", () => {
  it("must return true for a valid update-profile step", () => {
    const updateProfileStep = {
      action: "update-profile",
      merge: "overwrite",
      recipient_id: "recipientId",
      profile: {},
    };
    expect(schemas["update-profile"](updateProfileStep)).toBe(true);
  });

  it("must throw error if has invalid merge option", () => {
    const updateProfileStep = {
      action: "update-profile",
      merge: "INVALID",
      recipient_id: "recipientId",
      profile: {},
    };
    expect(schemas["update-profile"](updateProfileStep)).toBe(false);
    expect(schemas["update-profile"].errors[0].message).toBe(
      "must be equal to one of the allowed values"
    );
  });

  it("must throw error if required argument merge is missing", () => {
    const updateProfileStep = {
      action: "update-profile",
      recipient_id: "recipientId",
      profile: {},
    };
    expect(schemas["update-profile"](updateProfileStep)).toBe(false);
    expect(schemas["update-profile"].errors[0].message).toBe(
      "must have required property 'merge'"
    );
  });

  it("must throw error if required argument recipient_id is missing", () => {
    const updateProfileStep = {
      action: "update-profile",
      merge: "none",
      profile: {},
    };
    expect(schemas["update-profile"](updateProfileStep)).toBe(false);
    expect(schemas["update-profile"].errors[0].message).toBe(
      "must have required property 'recipient_id'"
    );
  });

  it("must throw error if required argument profile is missing", () => {
    const updateProfileStep = {
      action: "update-profile",
      merge: "soft-merge",
      recipient_id: "recipientId",
    };
    expect(schemas["update-profile"](updateProfileStep)).toBe(false);
    expect(schemas["update-profile"].errors[0].message).toBe(
      "must have required property 'profile'"
    );
  });
});

describe("Validate Subscribe Step", () => {
  it("must return true for a valid subscribe step", () => {
    const subscribeStep = {
      action: "subscribe",
      list_id: "listId",
      recipient_id: "recipient_id",
      subscription: {
        preferences: {
          notification: {},
          categories: {},
        },
      },
    };
    expect(schemas["subscribe"](subscribeStep)).toBe(true);
  });

  it("must throw error if required argument list_id is missing", () => {
    const subscribeStep = {
      action: "subscribe",
      recipient_id: "recipient_id",
    };
    expect(schemas["subscribe"](subscribeStep)).toBe(false);
    expect(schemas["subscribe"].errors[0].message).toBe(
      "must have required property 'list_id'"
    );
  });

  it("must throw error if required argument recipient_id is missing", () => {
    const subscribeStep = {
      action: "subscribe",
      list_id: "listId",
    };
    expect(schemas["subscribe"](subscribeStep)).toBe(false);
    expect(schemas["subscribe"].errors[0].message).toBe(
      "must have required property 'recipient_id'"
    );
  });
});

describe("Validate list of all steps", () => {
  it("must return true for a valid list of steps", () => {
    const stepList = [
      {
        action: "delay",
        duration: "1 hour",
      },
      {
        action: "fetch-data",
        webhook: {
          url: "https://somewebhook.com",
          headers: {},
          method: "get",
        },
        merge_strategy: "replace",
      },
      {
        action: "send",
        recipient: "abc",
        profile: {
          email: "email@gmail.com",
        },
        template: "templateId",
      },
    ];
    expect(schemas.validateAllSteps(stepList)).toBe(true);
  });

  it("must return true with valid step references and condtionals", () => {
    const stepList = [
      {
        action: "send",
        template: "OUTREACH",
        recipient: "abc",
        ref: "outreach",
      },
      {
        action: "delay",
        delayFor: "24 hours",
      },
      {
        action: "send",
        template: "FOLLOWUP",
        recipient: "abc",
        ref: "followup",
        if: "refs.outreach.status < MessageStatus.Opened",
      },
    ];
    expect(schemas.validateAllSteps(stepList)).toBe(true);
  });

  it("must return true since arguments could be taken from the root level", () => {
    const stepList = [
      {
        action: "send",
        template: "invite-user",
        recipient: "abc",
      },
      {
        action: "delay",
        delayFor: "1 day",
      },
      {
        action: "send",
        template: "invite-reminder",
        recipient: "abc",
      },
    ];
    expect(schemas.validateAllSteps(stepList)).toBe(true);
  });

  it("must return true for generic digests", () => {
    const stepList = [
      {
        action: "fetch-data",
        webhook: {
          url: "https://main.app/digest",
        },
        merge_strategy: "replace",
      },
      {
        action: "send-list",
        list: "TEAM-LIST",
        template: "WEEKLY-GENERIC-DIGEST",
      },
    ];
    expect(schemas.validateAllSteps(stepList)).toBe(true);
  });

  it("must return true for recipient digests", () => {
    const stepList = [
      {
        action: "send-list",
        list: "TEAM-LIST",
        template: "WEEKLY-RECIPIENT-DIGEST",
        data_source: {
          webhook: {
            url: "https://main.app/digest",
            method: "GET",
          },
          merge_strategy: "replace",
        },
      },
    ];
    expect(schemas.validateAllSteps(stepList)).toBe(true);
  });

  it("must return true for valid send+invoke step", () => {
    const stepList = [
      {
        action: "send",
        template: "SALE-OUTREACH",
        recipient: "abc-123",
        profile: {
          email: "test@gmail.com",
        },
      },
      {
        action: "invoke",
        template: "44951efc-ae0d-4f08-bd6c-2e2e65cb6ead",
      },
    ];
    expect(schemas.validateAllSteps(stepList)).toBe(true);
  });

  it("must throw error if step has invalid action", () => {
    const stepList = [
      {
        action: "delay",
        duration: "1 hour",
      },
      {
        action: "NOT SEND",
        recipient: "abc",
        profile: {
          email: "email@gmail.com",
        },
        template: "templateId",
      },
    ];
    expect(schemas.validateAllSteps(stepList)).toBe(false);
    expect(
      schemas.validateAllSteps.errors[
        schemas.validateAllSteps.errors.length - 1
      ].message
    ).toBe("must match a schema in anyOf");
  });
});
