import { S3Handler } from "aws-lambda";

const handler: S3Handler = async (event) => {
  console.log("Event Received", JSON.stringify(event, null, 2));
};

export default handler;
