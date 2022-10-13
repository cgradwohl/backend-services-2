import s3 from "~/lib/s3";
import getEnvVar from "~/lib/get-environment-variable";

export const store = s3(getEnvVar("SEND_DATA_BUCKET"));
export const TableName = getEnvVar("SEND_DATA_TABLE");
