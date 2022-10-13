import { NotFound } from "~/lib/http-errors";

import * as dynamoModule from "../../../../lib/dynamo";
import dynamoObjectService from "../../../../lib/dynamo/object-service";
import { IDynamoDbObjectService } from "../../../../lib/dynamo/object-service/types";
import { CreateCourierObject } from "../../../../types.api";

jest.mock("../../../../lib/dynamo");

const dynamo = dynamoModule as any;

// test values
const tenantId = "testTenantId";
const userId = "testUserId";
const id = "testId";
const TableName = "testObjectsTableName";
const objtype = "testObject";

interface ITestObject {
  test: boolean;
}

describe("DynamoDB Object Service", () => {
  const OLD_ENV = process.env;
  let testObject: IDynamoDbObjectService<ITestObject>;

  describe("with scopedId", () => {
    const testObj: CreateCourierObject<ITestObject> = {
      id: "<mock:id>",
      json: {
        test: true,
      },
      title: "Test Object",
    };

    beforeEach(() => {
      jest
        .spyOn(Date.prototype, "getTime")
        .mockImplementation(() => 1578429824243);

      process.env = {
        ...OLD_ENV,
        OBJECTS_TABLE_NAME: TableName,
      };

      testObject = dynamoObjectService<ITestObject>(objtype, {
        useScopedId: true,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      process.env = OLD_ENV;
    });

    it("should create an object using dynamodb with scopedId", async () => {
      dynamo.put.mockResolvedValue({});

      await expect(
        testObject.create({ tenantId, userId }, testObj)
      ).resolves.toEqual(
        expect.objectContaining({
          ...testObj,
          created: expect.any(Number),
          creator: "testUserId",
          id: "testObject/<mock:id>",
          objtype,
          tenantId: "testTenantId",
        })
      );

      expect(dynamo.id.mock.calls.length).toEqual(0);
      expect(dynamo.put.mock.calls.length).toEqual(1);
      expect(dynamo.put.mock.calls[0]).toEqual([
        {
          ConditionExpression: "attribute_not_exists(id)",
          Item: {
            created: expect.any(Number),
            creator: userId,
            id: "testObject/<mock:id>",
            json: JSON.stringify(testObj.json),
            objtype,
            tenantId,
            title: "Test Object",
            updated: 1578429824243,
            updater: "testUserId",
          },
          TableName,
        },
      ]);
    });

    it("should get an item from dynamodb", async () => {
      const testItem = {
        json: { isTestJson: true },
        objtype,
        title: "Item Title",
      };

      dynamo.getItem.mockResolvedValue({ Item: testItem });

      await expect(
        testObject.get({ id: testObj.id, tenantId })
      ).resolves.toEqual(testItem);

      expect(dynamo.getItem.mock.calls.length).toEqual(1);
      expect(dynamo.getItem.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "Key": Object {
              "id": "testObject/<mock:id>",
              "tenantId": "testTenantId",
            },
            "ReturnConsumedCapacity": "TOTAL",
            "TableName": "testObjectsTableName",
          },
        ]
      `);
    });
  });

  describe("no scopeId", () => {
    beforeEach(() => {
      jest
        .spyOn(Date.prototype, "getTime")
        .mockImplementation(() => 1578429824243);

      process.env = {
        ...OLD_ENV,
        OBJECTS_TABLE_NAME: TableName,
      };
      testObject = dynamoObjectService<ITestObject>(objtype);
    });

    afterEach(() => {
      jest.clearAllMocks();
      process.env = OLD_ENV;
    });

    describe("default function", () => {
      it("should be a function", () => {
        expect(typeof dynamoObjectService).toBe("function");
      });
      it("should create an object service for an object", () => {
        expect(() => dynamoObjectService("event")).not.toThrow();
      });
    });

    describe("archive", () => {
      it("should archive an object using dynamodb", async () => {
        dynamo.update.mockResolvedValue({});

        await expect(
          testObject.archive({ id, tenantId, userId })
        ).resolves.toBe(undefined);

        expect(dynamo.update.mock.calls.length).toEqual(1);
        expect(dynamo.update.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "ConditionExpression": "attribute_exists(id)",
              "ExpressionAttributeValues": Object {
                ":archived": true,
                ":updated": 1578429824243,
                ":updater": "testUserId",
              },
              "Key": Object {
                "id": "testId",
                "tenantId": "testTenantId",
              },
              "ReturnValues": "NONE",
              "TableName": "testObjectsTableName",
              "UpdateExpression": "set archived = :archived, updated = :updated, updater = :updater",
            },
          ]
        `);
      });
    });

    describe("batchGet", () => {
      it("should batchGet objects using dynamodb", async () => {
        const json = { test: "one" };

        dynamo.batchGet.mockResolvedValue({
          Responses: {
            [TableName]: [
              { id: "responseObj1", json: JSON.stringify(json) },
              { id: "responseObj2", json },
              { id: "responseObj2", json },
            ],
          },
        });

        const configurationIds = [
          "configurationId1",
          "configurationId2",
          "configurationId3",
        ];

        await expect(
          testObject.batchGet({ configurationIds, tenantId })
        ).resolves.toEqual([
          { id: "responseObj1", json },
          { id: "responseObj2", json },
          { id: "responseObj2", json },
        ]);

        expect(dynamo.batchGet.mock.calls.length).toEqual(1);
        expect(dynamo.batchGet.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "RequestItems": Object {
                "testObjectsTableName": Object {
                  "Keys": Array [
                    Object {
                      "id": "configurationId1",
                      "tenantId": "testTenantId",
                    },
                    Object {
                      "id": "configurationId2",
                      "tenantId": "testTenantId",
                    },
                    Object {
                      "id": "configurationId3",
                      "tenantId": "testTenantId",
                    },
                  ],
                },
              },
              "ReturnConsumedCapacity": "TOTAL",
            },
          ]
        `);
      });
    });

    describe("count", () => {
      it("should count objects in dynamodb", async () => {
        dynamo.query.mockResolvedValue({ Count: 123 });

        await expect(testObject.count({ tenantId })).resolves.toBe(123);

        expect(dynamo.query.mock.calls.length).toEqual(1);
        expect(dynamo.query.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "ExpressionAttributeValues": Object {
                ":objtype": "testObject",
                ":strategyId": undefined,
                ":tenantId": "testTenantId",
                ":true": true,
              },
              "FilterExpression": "archived <> :true",
              "IndexName": "by-objtype-index",
              "KeyConditionExpression": "tenantId = :tenantId AND objtype = :objtype",
              "Select": "COUNT",
              "TableName": "testObjectsTableName",
            },
          ]
        `);
      });

      it("should respect the archived option", async () => {
        dynamo.query.mockResolvedValue({ Count: 123 });

        await expect(
          testObject.count({ archived: true, tenantId })
        ).resolves.toBe(123);

        expect(dynamo.query.mock.calls.length).toEqual(1);
        expect(dynamo.query.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "ExpressionAttributeValues": Object {
                ":objtype": "testObject",
                ":strategyId": undefined,
                ":tenantId": "testTenantId",
                ":true": true,
              },
              "FilterExpression": "",
              "IndexName": "by-objtype-index",
              "KeyConditionExpression": "tenantId = :tenantId AND objtype = :objtype",
              "Select": "COUNT",
              "TableName": "testObjectsTableName",
            },
          ]
        `);
      });

      it("should allow filtering by strategyId if object is an event", async () => {
        dynamo.query.mockResolvedValue({ Count: 123 });

        const strategyId = "testStrategyId";
        const events = dynamoObjectService("event");

        await expect(events.count({ strategyId, tenantId })).resolves.toBe(123);

        expect(dynamo.query.mock.calls.length).toEqual(1);
        expect(dynamo.query.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "ExpressionAttributeValues": Object {
                ":objtype": "event",
                ":strategyId": "testStrategyId",
                ":tenantId": "testTenantId",
                ":true": true,
              },
              "FilterExpression": "archived <> :true AND json.strategyId = :strategyId",
              "IndexName": "by-objtype-index",
              "KeyConditionExpression": "tenantId = :tenantId AND objtype = :objtype",
              "Select": "COUNT",
              "TableName": "testObjectsTableName",
            },
          ]
        `);
      });
    });

    describe("create", () => {
      it("should create an object using dynamodb", async () => {
        dynamo.id.mockReturnValue(id);
        dynamo.put.mockResolvedValue({});

        const testObj: CreateCourierObject<ITestObject> = {
          json: {
            test: true,
          },
          title: "Test Object",
        };

        await expect(
          testObject.create({ tenantId, userId }, testObj)
        ).resolves.toEqual(
          expect.objectContaining({
            created: expect.any(Number),
            creator: "testUserId",
            id,
            objtype,
            tenantId: "testTenantId",
            ...testObj,
          })
        );

        expect(dynamo.id.mock.calls.length).toEqual(1);
        expect(dynamo.id.mock.calls[0]).toEqual([]);
        expect(dynamo.put.mock.calls.length).toEqual(1);
        expect(dynamo.put.mock.calls[0]).toEqual([
          {
            Item: {
              created: expect.any(Number),
              creator: userId,
              id,
              json: JSON.stringify(testObj.json),
              objtype,
              tenantId,
              title: "Test Object",
              updated: 1578429824243,
              updater: "testUserId",
            },
            TableName,
          },
        ]);
      });
    });

    describe("duplicate", () => {
      it("should duplicate a dynamodb object", async () => {
        const testItem = {
          json: { isTestJson: true },
          objtype,
          title: "Item Title",
        };

        dynamo.getItem.mockResolvedValue({ Item: testItem });
        dynamo.id.mockReturnValue(id);
        dynamo.put.mockResolvedValue(testItem);

        await expect(
          testObject.duplicate({ id: "originalItemId", tenantId, userId })
        ).resolves.toEqual(
          expect.objectContaining({
            created: expect.any(Number),
            creator: "testUserId",
            id,
            objtype,
            tenantId: "testTenantId",
            ...testItem,
            title: testItem.title + " COPY",
          })
        );

        expect(dynamo.id.mock.calls.length).toEqual(1);
        expect(dynamo.id.mock.calls[0]).toEqual([]);
        expect(dynamo.getItem.mock.calls.length).toEqual(1);
        expect(dynamo.getItem.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "Key": Object {
                "id": "originalItemId",
                "tenantId": "testTenantId",
              },
              "ReturnConsumedCapacity": "TOTAL",
              "TableName": "testObjectsTableName",
            },
          ]
        `);
        expect(dynamo.put.mock.calls.length).toEqual(1);
        expect(dynamo.put.mock.calls[0]).toEqual([
          {
            Item: {
              created: expect.any(Number),
              creator: userId,
              id,
              json: { isTestJson: true },
              objtype,
              tenantId,
              title: "Item Title COPY",
              updated: 1578429824243,
              updater: "testUserId",
            },
            TableName,
          },
        ]);
      });
    });

    describe("get", () => {
      it("should get an item from dynamodb", async () => {
        const testItem = {
          json: { isTestJson: true },
          objtype,
          title: "Item Title",
        };

        dynamo.getItem.mockResolvedValue({ Item: testItem });

        await expect(testObject.get({ id, tenantId })).resolves.toEqual(
          testItem
        );

        expect(dynamo.getItem.mock.calls.length).toEqual(1);
        expect(dynamo.getItem.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "Key": Object {
                "id": "testId",
                "tenantId": "testTenantId",
              },
              "ReturnConsumedCapacity": "TOTAL",
              "TableName": "testObjectsTableName",
            },
          ]
        `);
      });

      it("should throw a not found error if no item returned", async () => {
        dynamo.getItem.mockResolvedValue({ Item: undefined });

        await expect(testObject.get({ id, tenantId })).rejects.toThrow(
          NotFound
        );
      });

      it("should get an item from dynamodb", async () => {
        const testItem = {
          json: { isTestJson: true },
          objtype: "A_DIFFERENT_OBJECT_TYPE",
          title: "Item Title",
        };

        dynamo.getItem.mockResolvedValue({ Item: testItem });

        await expect(testObject.get({ id, tenantId })).rejects.toThrow(
          NotFound
        );
      });
    });

    describe("list", () => {
      it("should return a list of items from dynamodb", async () => {
        const results = [
          {
            archived: undefined,
            created: 123,
            creator: userId,
            id,
            json: { isTestJson: true },
            objtype,
            tenantId,
            title: "Item 1",
          },
          {
            archived: undefined,
            created: 123,
            creator: userId,
            id: `${id} 2`,
            json: { isTestJson: true },
            objtype,
            tenantId,
            title: "Item 1",
          },
        ];

        dynamo.query.mockResolvedValue({ Items: results });

        await expect(testObject.list({ tenantId })).resolves
          .toMatchInlineSnapshot(`
                Object {
                  "lastEvaluatedKey": undefined,
                  "objects": Array [
                    Object {
                      "archived": undefined,
                      "created": 123,
                      "creator": "testUserId",
                      "id": "testId",
                      "json": Object {
                        "isTestJson": true,
                      },
                      "objtype": "testObject",
                      "tenantId": "testTenantId",
                      "title": "Item 1",
                    },
                    Object {
                      "archived": undefined,
                      "created": 123,
                      "creator": "testUserId",
                      "id": "testId 2",
                      "json": Object {
                        "isTestJson": true,
                      },
                      "objtype": "testObject",
                      "tenantId": "testTenantId",
                      "title": "Item 1",
                    },
                  ],
                }
              `);

        expect(dynamo.query.mock.calls.length).toEqual(1);
        expect(dynamo.query.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "ExclusiveStartKey": undefined,
              "ExpressionAttributeValues": Object {
                ":objtype": "testObject",
                ":tenantId": "testTenantId",
                ":true": true,
              },
              "FilterExpression": "archived <> :true",
              "IndexName": "by-objtype-index",
              "KeyConditionExpression": "tenantId = :tenantId AND objtype = :objtype",
              "ReturnConsumedCapacity": "TOTAL",
              "TableName": "testObjectsTableName",
            },
          ]
        `);
      });

      it("should return a list of items using the archive option", async () => {
        const results = [
          {
            archived: undefined,
            created: 123,
            creator: userId,
            id,
            json: { isTestJson: true },
            objtype,
            tenantId,
            title: "Item 1",
          },
          {
            archived: undefined,
            created: 123,
            creator: userId,
            id: `${id} 2`,
            json: { isTestJson: true },
            objtype,
            tenantId,
            title: "Item 1",
          },
        ];

        dynamo.query.mockResolvedValue({ Items: results });

        await expect(testObject.list({ archived: true, tenantId })).resolves
          .toMatchInlineSnapshot(`
                Object {
                  "lastEvaluatedKey": undefined,
                  "objects": Array [
                    Object {
                      "archived": undefined,
                      "created": 123,
                      "creator": "testUserId",
                      "id": "testId",
                      "json": Object {
                        "isTestJson": true,
                      },
                      "objtype": "testObject",
                      "tenantId": "testTenantId",
                      "title": "Item 1",
                    },
                    Object {
                      "archived": undefined,
                      "created": 123,
                      "creator": "testUserId",
                      "id": "testId 2",
                      "json": Object {
                        "isTestJson": true,
                      },
                      "objtype": "testObject",
                      "tenantId": "testTenantId",
                      "title": "Item 1",
                    },
                  ],
                }
              `);

        expect(dynamo.query.mock.calls.length).toEqual(1);
        expect(dynamo.query.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "ExclusiveStartKey": undefined,
              "ExpressionAttributeValues": Object {
                ":objtype": "testObject",
                ":tenantId": "testTenantId",
                ":true": true,
              },
              "FilterExpression": "archived = :true",
              "IndexName": "by-objtype-index",
              "KeyConditionExpression": "tenantId = :tenantId AND objtype = :objtype",
              "ReturnConsumedCapacity": "TOTAL",
              "TableName": "testObjectsTableName",
            },
          ]
        `);
      });

      it("should return a list of items using the archive = false option", async () => {
        const results = [
          {
            archived: undefined,
            created: 123,
            creator: userId,
            id,
            json: { isTestJson: true },
            objtype,
            tenantId,
            title: "Item 1",
          },
          {
            archived: undefined,
            created: 123,
            creator: userId,
            id: `${id} 2`,
            json: { isTestJson: true },
            objtype,
            tenantId,
            title: "Item 1",
          },
        ];

        dynamo.query.mockResolvedValue({ Items: results });

        await expect(testObject.list({ archived: false, tenantId })).resolves
          .toMatchInlineSnapshot(`
                Object {
                  "lastEvaluatedKey": undefined,
                  "objects": Array [
                    Object {
                      "archived": undefined,
                      "created": 123,
                      "creator": "testUserId",
                      "id": "testId",
                      "json": Object {
                        "isTestJson": true,
                      },
                      "objtype": "testObject",
                      "tenantId": "testTenantId",
                      "title": "Item 1",
                    },
                    Object {
                      "archived": undefined,
                      "created": 123,
                      "creator": "testUserId",
                      "id": "testId 2",
                      "json": Object {
                        "isTestJson": true,
                      },
                      "objtype": "testObject",
                      "tenantId": "testTenantId",
                      "title": "Item 1",
                    },
                  ],
                }
              `);

        expect(dynamo.query.mock.calls.length).toEqual(1);
        expect(dynamo.query.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "ExclusiveStartKey": undefined,
              "ExpressionAttributeValues": Object {
                ":objtype": "testObject",
                ":tenantId": "testTenantId",
                ":true": true,
              },
              "FilterExpression": "archived <> :true",
              "IndexName": "by-objtype-index",
              "KeyConditionExpression": "tenantId = :tenantId AND objtype = :objtype",
              "ReturnConsumedCapacity": "TOTAL",
              "TableName": "testObjectsTableName",
            },
          ]
        `);
      });
    });

    describe("remove", () => {
      it("should remove an item from dynamodb", async () => {
        dynamo.getItem.mockResolvedValue({ Item: { objtype } });
        dynamo.deleteItem.mockResolvedValue({});

        await expect(testObject.remove({ id, tenantId })).resolves.toEqual({});

        expect(dynamo.getItem.mock.calls.length).toEqual(1);
        expect(dynamo.getItem.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "Key": Object {
                "id": "testId",
                "tenantId": "testTenantId",
              },
              "ReturnConsumedCapacity": "TOTAL",
              "TableName": "testObjectsTableName",
            },
          ]
        `);

        expect(dynamo.deleteItem.mock.calls.length).toEqual(1);
        expect(dynamo.deleteItem.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "Key": Object {
                "id": "testId",
                "tenantId": "testTenantId",
              },
              "TableName": "testObjectsTableName",
            },
          ]
        `);
      });
    });

    describe("replace", () => {
      it("should replace a dynamodb item", async () => {
        const testItem = {
          json: { isTestJson: true },
          objtype,
          title: "Item Title",
        };

        dynamo.update.mockResolvedValue(testItem);

        await expect(testObject.replace({ id, tenantId, userId }, testItem))
          .resolves.toMatchInlineSnapshot(`
                Object {
                  "json": Object {
                    "isTestJson": true,
                  },
                  "title": "Item Title",
                }
              `);

        expect(dynamo.update.mock.calls.length).toEqual(1);
        expect(dynamo.update.mock.calls[0]).toMatchInlineSnapshot(`
          Array [
            Object {
              "ExpressionAttributeValues": Object {
                ":archived": false,
                ":created": 1578429824243,
                ":creator": "testUserId",
                ":json": "{\\"isTestJson\\":true}",
                ":objtype": "testObject",
                ":title": "Item Title",
                ":updated": 1578429824243,
                ":updater": "testUserId",
              },
              "Key": Object {
                "id": "testId",
                "tenantId": "testTenantId",
              },
              "ReturnValues": "ALL_NEW",
              "TableName": "testObjectsTableName",
              "UpdateExpression": "set title = :title, archived = :archived, json = :json, objtype = if_not_exists(objtype, :objtype), created = :created, creator = if_not_exists(creator, :creator), updated = :updated, updater = :updater",
            },
          ]
        `);
      });
    });
  });
});
