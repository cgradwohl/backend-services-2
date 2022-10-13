import s3 from "~/lib/s3";
import { ITrackingRequest } from "../types";

export default s3<ITrackingRequest>(process.env.TRACKING_REQUEST_STORE);
