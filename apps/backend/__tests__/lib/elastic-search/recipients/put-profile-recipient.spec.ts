import { IProfileObject } from "~/lib/dynamo/profiles";
import putProfileRecipient, {
  es,
} from "~/lib/elastic-search/recipients/put-profile-recipient";

jest.mock("~/lib/elastic-search/index", () => {
  return jest.fn(() => ({ put: jest.fn() }));
});

const mockEs = es as any;

const baseProfileObject: IProfileObject = {
  id: "an-id",
  tenantId: "a-tenant-id",
  updated: 1414514515415,
};

describe("when putting a profile-recipient into ES", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will put the entire document", async () => {
    const profile: IProfileObject = {
      ...baseProfileObject,
      json: {
        email: "support@courier.com",
        firstName: "Foo",
        lastName: "Bar",
        phone_number: "141451541541541",
        updated_at: new Date("2020-03-16").getTime(),
      },
    };

    await putProfileRecipient(profile);

    expect(mockEs.put.mock.calls.length).toBe(1);
    expect(mockEs.put.mock.calls[0][0]).toBe("YS10ZW5hbnQtaWQvYW4taWQ=");
    expect(mockEs.put.mock.calls[0][1]).toMatchInlineSnapshot(
      {
        email: "support@courier.com",
        id: "YS10ZW5hbnQtaWQvYW4taWQ=",
        phone_number: "141451541541541",
        tenantId: "a-tenant-id",
        type: "user",
        updated_at: 1414514515415,
      },
      `
      Object {
        "email": "support@courier.com",
        "firstName": "Foo",
        "id": "YS10ZW5hbnQtaWQvYW4taWQ=",
        "lastName": "Bar",
        "phone_number": "141451541541541",
        "recipientId": "an-id",
        "tenantId": "a-tenant-id",
        "type": "user",
        "updated_at": 1414514515415,
      }
    `
    );
  });

  it("will put in some of the doc if fields are not allowed", async () => {
    const profile: IProfileObject = {
      ...baseProfileObject,
      json: {
        discord: {
          channel: 141451451541,
        },
        email: "support@courier.com",
        phone_numbe: "141451541541541",
        updated_at: new Date("2020-03-16").getTime(),
      },
    };

    await putProfileRecipient(profile);

    expect(mockEs.put.mock.calls.length).toBe(1);
    expect(mockEs.put.mock.calls[0][0]).toBe("YS10ZW5hbnQtaWQvYW4taWQ=");
    expect(mockEs.put.mock.calls[0][1]).toMatchInlineSnapshot(
      {
        email: "support@courier.com",
        id: "YS10ZW5hbnQtaWQvYW4taWQ=",
        tenantId: "a-tenant-id",
        type: "user",
        updated_at: 1414514515415,
      },
      `
      Object {
        "email": "support@courier.com",
        "id": "YS10ZW5hbnQtaWQvYW4taWQ=",
        "recipientId": "an-id",
        "tenantId": "a-tenant-id",
        "type": "user",
        "updated_at": 1414514515415,
      }
    `
    );
  });

  it("will drop phone_number if phone_number is the incorrect type", async () => {
    const profile: IProfileObject = {
      ...baseProfileObject,
      json: {
        email: "support@courier.com",
        phone_number: 141451541541541,
        updated_at: new Date("2020-03-16").getTime(),
      },
    };

    await putProfileRecipient(profile);

    expect(mockEs.put.mock.calls.length).toBe(1);
    expect(mockEs.put.mock.calls[0][0]).toBe("YS10ZW5hbnQtaWQvYW4taWQ=");
    expect(mockEs.put.mock.calls[0][1]).toMatchInlineSnapshot(
      {
        email: "support@courier.com",
        id: "YS10ZW5hbnQtaWQvYW4taWQ=",
        tenantId: "a-tenant-id",
        type: "user",
        updated_at: 1414514515415,
      },
      `
      Object {
        "email": "support@courier.com",
        "id": "YS10ZW5hbnQtaWQvYW4taWQ=",
        "recipientId": "an-id",
        "tenantId": "a-tenant-id",
        "type": "user",
        "updated_at": 1414514515415,
      }
    `
    );
  });

  it("will drop phone_number if phone_number is empty", async () => {
    const profile: IProfileObject = {
      ...baseProfileObject,
      json: {
        email: "support@courier.com",
        phone_number: "",
        updated_at: new Date("2020-03-16").getTime(),
      },
    };

    await putProfileRecipient(profile);

    expect(mockEs.put.mock.calls.length).toBe(1);
    expect(mockEs.put.mock.calls[0][0]).toBe("YS10ZW5hbnQtaWQvYW4taWQ=");
    expect(mockEs.put.mock.calls[0][1]).toMatchInlineSnapshot(
      {
        email: "support@courier.com",
        id: "YS10ZW5hbnQtaWQvYW4taWQ=",
        tenantId: "a-tenant-id",
        type: "user",
        updated_at: 1414514515415,
      },
      `
      Object {
        "email": "support@courier.com",
        "id": "YS10ZW5hbnQtaWQvYW4taWQ=",
        "recipientId": "an-id",
        "tenantId": "a-tenant-id",
        "type": "user",
        "updated_at": 1414514515415,
      }
    `
    );
  });

  it("will drop phone_number and birthdate if they have value _", async () => {
    const profile: IProfileObject = {
      ...baseProfileObject,
      json: {
        birthdate: "_",
        email: "support@courier.com",
        phone_number: "_",
        updated_at: new Date("2020-03-16").getTime(),
      },
    };

    await putProfileRecipient(profile);

    expect(mockEs.put.mock.calls.length).toBe(1);
    expect(mockEs.put.mock.calls[0][0]).toBe("YS10ZW5hbnQtaWQvYW4taWQ=");
    expect(mockEs.put.mock.calls[0][1]).toMatchInlineSnapshot(
      {
        email: "support@courier.com",
        id: "YS10ZW5hbnQtaWQvYW4taWQ=",
        tenantId: "a-tenant-id",
        type: "user",
        updated_at: 1414514515415,
      },
      `
      Object {
        "email": "support@courier.com",
        "id": "YS10ZW5hbnQtaWQvYW4taWQ=",
        "recipientId": "an-id",
        "tenantId": "a-tenant-id",
        "type": "user",
        "updated_at": 1414514515415,
      }
    `
    );
  });

  it("will drop address if address is an empty object", async () => {
    const profile: IProfileObject = {
      ...baseProfileObject,
      json: {
        address: {},
        email: "support@courier.com",
        phone_number: "141451541541541",
        updated_at: new Date("2020-03-16").getTime(),
      },
    };

    await putProfileRecipient(profile);

    expect(mockEs.put.mock.calls.length).toBe(1);
    expect(mockEs.put.mock.calls[0][0]).toBe("YS10ZW5hbnQtaWQvYW4taWQ=");
    expect(mockEs.put.mock.calls[0][1]).toMatchInlineSnapshot(
      {
        email: "support@courier.com",
        id: "YS10ZW5hbnQtaWQvYW4taWQ=",
        phone_number: "141451541541541",
        tenantId: "a-tenant-id",
        type: "user",
        updated_at: 1414514515415,
      },
      `
      Object {
        "email": "support@courier.com",
        "id": "YS10ZW5hbnQtaWQvYW4taWQ=",
        "phone_number": "141451541541541",
        "recipientId": "an-id",
        "tenantId": "a-tenant-id",
        "type": "user",
        "updated_at": 1414514515415,
      }
    `
    );
  });

  it("will include address if it contains at least one property", async () => {
    const profile: IProfileObject = {
      ...baseProfileObject,
      json: {
        address: { country: "USA" },
      },
    };

    await putProfileRecipient(profile);

    expect(mockEs.put.mock.calls.length).toBe(1);
    expect(mockEs.put.mock.calls[0][0]).toBe("YS10ZW5hbnQtaWQvYW4taWQ=");
    expect(mockEs.put.mock.calls[0][1]).toMatchInlineSnapshot(
      {
        address: {
          country: "USA",
        },
        id: "YS10ZW5hbnQtaWQvYW4taWQ=",
        tenantId: "a-tenant-id",
        type: "user",
        updated_at: 1414514515415,
      },
      `
      Object {
        "address": Object {
          "country": "USA",
        },
        "id": "YS10ZW5hbnQtaWQvYW4taWQ=",
        "recipientId": "an-id",
        "tenantId": "a-tenant-id",
        "type": "user",
        "updated_at": 1414514515415,
      }
    `
    );
  });

  it("will not put the document if ID is missing", async () => {
    delete baseProfileObject["id"];

    await putProfileRecipient(baseProfileObject);

    expect(mockEs.put.mock.calls.length).toBe(0);
  });
});
