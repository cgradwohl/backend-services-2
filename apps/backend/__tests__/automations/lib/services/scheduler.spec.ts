import parser from "cron-parser";
import { addSeconds, subSeconds } from "date-fns";
import uuid from "uuid";
import schedulerService, {
  calculateTTL,
} from "~/automations/lib/services/scheduler";
import { IScheduleItem } from "~/automations/types";
import { update } from "~/lib/dynamo";

// this is imported by stepReference
// use this import instead in this closure
jest.mock("~/automations/lib/stores/dynamo", () => ({
  update: jest.fn((params) => mockUpdate(params)),
  getItem: jest.fn(),
  query: jest.fn(),
  id: jest.fn(() => uuid()),
}));

const mockUpdate = jest.fn();

describe("Automation Scheduler Service", () => {
  const tenantId = "tenantId-1";
  const templateId = "templateId-1";
  const scope = "draft/test";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new schedule item on save, if itemId is undefined", async () => {
    const scheduler = schedulerService(tenantId, scope);

    const expectedItem: IScheduleItem = {
      enabled: false,
      scope,
      templateId,
      tenantId,
      ttl: 123,
      value: "0 9 * * 5",
    };

    await scheduler.saveItem(expectedItem);

    const [actualParams] = mockUpdate.mock.calls
      .map((callArray) => callArray[0])
      .map((call) => call.ExpressionAttributeValues)
      .map((values) => ({
        enabled: values[":enabled"],
        itemId: values[":itemId"],
        scope: values[":scope"],
        templateId: values[":templateId"],
        tenantId: values[":tenantId"],
        ttl: values[":ttl"],
      }));

    expect(expectedItem.itemId).toBeUndefined();
    expect(actualParams.itemId).toBeDefined();
  });
});

describe("calculateTTL service", () => {
  it("should return undefined, given an invalid string", () => {
    const invalidString = "I am not a date or crontab";

    const result = calculateTTL(invalidString);

    expect(result).toBeUndefined();
  });

  it("should return undefined if passed an expired ISO 8601 date string", () => {
    const now = new Date();
    const oldDateString = new Date(subSeconds(now, 10)).toISOString();

    const result = calculateTTL(oldDateString);

    expect(result).toBeUndefined();
  });

  it("should return a valid epoch number, given a valid ISO 8601 string", () => {
    const now = addSeconds(new Date(), 100);

    const expectedEpoch = Math.floor(now.getTime() / 1000);
    const nowString = now.toISOString();

    const result = calculateTTL(nowString);

    expect(result).toBeDefined();
    expect(result).toBe(expectedEpoch);
  });

  it("should return a valid epoch number, given a valid crontab string", () => {
    const cron = "0 9 * * 5";
    const interval = parser.parseExpression(cron);
    const expectedEpoch = Math.floor(
      new Date(interval.next().toString()).getTime() / 1000
    );

    const result = calculateTTL(cron);

    expect(result).toBeDefined();
    expect(result).toBe(expectedEpoch);
  });
});
