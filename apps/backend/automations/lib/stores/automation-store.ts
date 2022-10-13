import s3 from "~/lib/s3";

export default s3<any>(process.env.AUTOMATION_STORE);
