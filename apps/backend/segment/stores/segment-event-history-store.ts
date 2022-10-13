import s3 from "~/lib/s3";

export default s3<any>(process.env.SEGMENT_EVENT_HISTORY_STORE);
