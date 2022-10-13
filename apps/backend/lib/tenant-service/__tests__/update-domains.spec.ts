import { QueryOutput } from "aws-sdk/clients/dynamodb";
import { addTenantToDomain, removeTenantFromDomain } from "~/lib/domains";
import * as dynamoModule from "~/lib/dynamo";

const mockedDomains = [
  { domain: "domain/courier.com", tenantId: "existingTenantId" },
  { domain: "domain/courier.com", tenantId: "removedTenantId" },
];

jest.mock("~/lib/dynamo");
const dynamo = dynamoModule as any;

describe("Update tenant domains", () => {
  const OLD_ENV = process.env;

  afterAll(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    const getTenantDomainsPromise = Promise.resolve({
      Items: mockedDomains,
    } as QueryOutput);
    jest
      .spyOn(dynamo, "query")
      .mockImplementation(() => getTenantDomainsPromise);

    process.env = {
      ...OLD_ENV,
      DOMAINS_TABLE: "MOCK_DOMAINS_TABLE_NAME",
    };
    jest.resetModules();
  });

  it("Should not try to add a new domain", async () => {
    await addTenantToDomain("courier.com", "existingTenantId");
    expect(dynamo.put.mock.calls.length).toEqual(0);
  });

  it("Should not try to remove a domain", async () => {
    await removeTenantFromDomain("courier.com", "nonExistingTenantId");
    expect(dynamo.deleteItem.mock.calls.length).toEqual(0);
  });

  it("Should add a tenant to domain table", async () => {
    await addTenantToDomain("trycourier.com", "addedTenantId");
    expect(dynamo.put.mock.calls.length).toEqual(1);
    expect(dynamo.put.mock.calls[0].length).toEqual(1);
    expect(dynamo.put.mock.calls[0][0].Item).toEqual({
      domain: "trycourier.com",
      pk: "domain/trycourier.com",
      sk: "addedTenantId",
      tenantId: "addedTenantId",
    });
  });

  it("should remove a tenant from domain table", async () => {
    await removeTenantFromDomain("courier.com", "removedTenantId");
    expect(dynamo.deleteItem.mock.calls.length).toEqual(1);
    expect(dynamo.deleteItem.mock.calls[0].length).toEqual(1);
    expect(dynamo.deleteItem.mock.calls[0][0].Key).toEqual({
      pk: "domain/courier.com",
      sk: "removedTenantId",
    });
  });
});
