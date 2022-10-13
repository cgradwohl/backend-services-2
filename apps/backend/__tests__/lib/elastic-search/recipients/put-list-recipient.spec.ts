import { IListItem } from "~/triggers/event-bridge/put-into-es";
import putListRecipient, {
  es,
} from "~/lib/elastic-search/recipients/put-list-recipient";

jest.mock("~/lib/elastic-search/index", () => {
  return jest.fn(() => ({ put: jest.fn() }));
});

const mockEs = es as any;

const baseListObject: IListItem = {
  id: "abc/mno/xyz",
  tenantId: "a-tenant-id",
  updated: 1414514515415,
  objtype: "list",
  archived: false,
  json: {},
};

describe("when putting a list-recipient into ES", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will put the entire document", async () => {
    await putListRecipient(baseListObject);
    const objectPutIntoES = mockEs.put.mock.calls[0][1];

    expect(mockEs.put.mock.calls.length).toBe(1);
    expect(mockEs.put.mock.calls[0][0]).toBe(
      "YS10ZW5hbnQtaWQvYWJjL21uby94eXo="
    );
    expect(objectPutIntoES.count).toEqual(0);
    expect(objectPutIntoES.type).toEqual("list");
    expect(objectPutIntoES.updated_at).toEqual(1414514515415);
  });

  it("will not put the document if ID is missing", async () => {
    delete baseListObject["id"];

    await putListRecipient(baseListObject);

    expect(mockEs.put.mock.calls.length).toBe(0);
  });
});
