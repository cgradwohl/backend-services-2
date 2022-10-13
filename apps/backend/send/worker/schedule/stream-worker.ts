import createEventHandler from "~/lib/kinesis/create-event-handler";
import { ScheduleJob, schedules } from "~/send/service/schedule";
import logger from "~/lib/logger";

const worker = async (job: ScheduleJob) => {
  try {
    await schedules(job.workspaceId).create(job);
  } catch (error) {
    logger.warn("Schedule Stream Worker Error");
    logger.warn(error);
  }
};

export default createEventHandler<ScheduleJob>(worker);
