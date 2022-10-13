import { ScheduleJob } from "../schedule-job.entity";

jest.mock("nanoid", () => {
  return { nanoid: () => "1234" };
});

describe("class ScheduleJob", () => {
  test("constructor should throw", () => {
    const item = {};
    expect(() => new ScheduleJob(item as any)).toThrow();
  });

  test("constructor", () => {
    const job = new ScheduleJob({
      expiration: 123,
      messageId: "mock",
      messageFilePath: "mock",
      requestId: "mock",
      workspaceId: "mock",
    });

    expect(job.created).toBeDefined();
    expect(job.scheduleJobId).toBeDefined();
    expect(job.updated).toBeDefined();
  });

  test("key", () => {
    const jobItemKey = ScheduleJob.key({ scheduleJobId: "mock" });
    expect(jobItemKey.pk).toBe("scheduleJob/mock");
    expect(jobItemKey.sk).toBe("scheduleJob/mock");
  });

  test("toItem", () => {
    const job = new ScheduleJob({
      expiration: 123,
      messageId: "mock",
      messageFilePath: "mock",
      requestId: "mock",
      workspaceId: "mock",
    });

    const jobItem = job.toItem();
    expect(jobItem.created).toBeDefined();
    expect(jobItem.expiration).toBeDefined();
    expect(jobItem.messageId).toBeDefined();
    expect(jobItem.messageFilePath).toBeDefined();
    expect(jobItem.requestId).toBeDefined();
    expect(jobItem.scheduleJobId).toBeDefined();
    expect(jobItem.updated).toBeDefined();
    expect(jobItem.workspaceId).toBeDefined();
    expect(jobItem.pk).toBe("scheduleJob/1234");
    expect(jobItem.sk).toBe("scheduleJob/1234");
  });

  test("fromItem", () => {
    const now = new Date().toISOString();
    const Item = {
      created: now,
      expiration: "mock",
      messageId: "mock",
      messageFilePath: "mock",
      requestId: "mock",
      scheduleJobId: "mock",
      updated: now,
      workspaceId: "mock",
      pk: "scheduleJob/1234",
      sk: "scheduleJob/1234",
    };

    const job = ScheduleJob.fromItem(Item);
    expect(job.created).toBe(now);
    expect(job.scheduleJobId).toBe("mock");
    expect(job.updated).toBe(now);
  });
});
